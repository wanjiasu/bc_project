'use client'

import { useState, useEffect } from 'react'
import { FiHeart } from 'react-icons/fi'
import styles from '../page.module.scss'

type MatchData = {
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

export default function MatchesTable() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/matches')
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toTimeString().slice(0, 5)
    } catch {
      return dateString
    }
  }

  const formatOdds = (odds: number) => {
    return odds > 0 ? odds.toFixed(2) : '-'
  }

  const formatAI = (recommendationIndex: number, predictedResult: string) => {
    if (recommendationIndex > 0) {
      return `${predictedResult} ${recommendationIndex}%`
    }
    return predictedResult || '-'
  }

  if (loading) {
    return (
      <div className={styles.matchesTable}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          加载中...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.matchesTable}>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          错误: {error}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.matchesTable}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>时间</th>
            <th>运动</th>
            <th>联赛</th>
            <th>对阵</th>
            <th>主胜</th>
            <th>平/让</th>
            <th>客胜</th>
            <th>AI</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {matches.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                暂无数据
              </td>
            </tr>
          ) : (
            matches.map((match) => (
              <tr key={match.id}>
                <td>{formatTime(match.fixture_date)}</td>
                <td>{match.sport}</td>
                <td>{match.league_name}</td>
                <td>
                  <button className={styles.favBtn}>
                    <FiHeart size={16} />
                  </button>
                  <span className={styles.matchTeams}>
                    {match.home_team} <span>vs</span> {match.away_team}
                  </span>
                </td>
                <td>{formatOdds(match.home_odds)}</td>
                <td>{formatOdds(match.draw_odds)}</td>
                <td>{formatOdds(match.away_odds)}</td>
                <td>{formatAI(match.recommendation_index, match.predicted_result)}</td>
                <td>
                  <button className={styles.dealBtn}>最划算渠道</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}