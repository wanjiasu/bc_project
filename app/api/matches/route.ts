import { NextResponse } from 'next/server'
import { getPool } from '../../../src/lib/postgres'

export type MatchData = {
  id: string
  fixture_date: string
  sport: string
  league_name: string
  home_team: string
  away_team: string
  home_odds: number
  draw_odds: number
  away_odds: number
  recommendation_index: number
  predicted_result: string
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
        predicted_result,
        ai_response
      FROM ai_eval
      WHERE recommendation_index IS NOT NULL 
        AND predicted_result IS NOT NULL 
        AND ai_response IS NOT NULL
        AND fixture_id IS NOT NULL
      ORDER BY recommendation_index DESC
      LIMIT 50
    `)

    const matches: MatchData[] = rows.map((row: any) => {
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

      // 提取平均赔率
      const averageOdds = aiResponse['平均赔率'] || {}
      
      return {
        id: row.fixture_id?.toString() || '',
        fixture_date: aiResponse.fixture_date || '',
        sport: 'soccer', // 暂时固定为soccer
        league_name: aiResponse.league_name || '',
        home_team: aiResponse.home_team || '',
        away_team: aiResponse.away_team || '',
        home_odds: averageOdds.Home || 0,
        draw_odds: averageOdds.Draw || 0,
        away_odds: averageOdds.Away || 0,
        recommendation_index: row.recommendation_index || 0,
        predicted_result: row.predicted_result || ''
      }
    }).filter(match => 
      // 过滤掉关键字段为空的数据
      match.fixture_date && 
      match.league_name && 
      match.home_team && 
      match.away_team
    )

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Failed to fetch matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches data' }, { status: 500 })
  }
}