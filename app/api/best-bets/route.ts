import { NextResponse } from 'next/server'
import { getPool } from '../../../src/lib/postgres'

export type BestBetData = {
  id: string
  recommendation_index: number
  recommendation_comment: string
  predicted_result: string
  league_name: string
  home_team: string
  away_team: string
  average_odds: {
    Home: number
    Draw: number
    Away: number
  }
}

export async function GET() {
  const db = getPool()
  
  if (!db) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
  }

  try {
    const { rows } = await db.query(`
      SELECT 
        fixture_id,
        recommendation_index,
        recommendation_comment,
        predicted_result,
        ai_response
      FROM ai_eval
      WHERE recommendation_index IS NOT NULL 
        AND recommendation_comment IS NOT NULL 
        AND predicted_result IS NOT NULL 
        AND ai_response IS NOT NULL
      ORDER BY recommendation_index DESC
      LIMIT 3
    `)

    const bestBets: BestBetData[] = rows.map((row: any) => {
      let aiResponse: any = {}
      
      // 解析 ai_response JSON 字段
      try {
        if (typeof row.ai_response === 'string') {
          aiResponse = JSON.parse(row.ai_response)
        } else if (typeof row.ai_response === 'object') {
          aiResponse = row.ai_response
        }
      } catch (error) {
        console.error('Failed to parse ai_response:', error)
      }

      return {
        id: row.fixture_id?.toString() || '',
        recommendation_index: row.recommendation_index || 0,
        recommendation_comment: row.recommendation_comment || '',
        predicted_result: row.predicted_result || '',
        league_name: aiResponse.league_name || '',
        home_team: aiResponse.home_team || '',
        away_team: aiResponse.away_team || '',
        average_odds: aiResponse['平均赔率'] || { Home: 0, Draw: 0, Away: 0 }
      }
    })

    return NextResponse.json(bestBets)
  } catch (error) {
    console.error('Failed to fetch best bets:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}