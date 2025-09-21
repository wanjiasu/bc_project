'use client'

import { useState, useEffect } from 'react'
import { FiHeart, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
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

type PaginationInfo = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

type ApiResponse = {
  matches: MatchData[]
  pagination: PaginationInfo
}

export default function MatchesTable() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches(1)
  }, [])

  const fetchMatches = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/matches?page=${page}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      
      const data: ApiResponse = await response.json()
      setMatches(data.matches || [])
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMatches(newPage)
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
      
      {/* 分页控件 */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={`${styles.paginationBtn} ${!pagination.hasPrev ? styles.disabled : ''}`}
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <FiChevronLeft size={16} />
            上一页
          </button>
          
          <div className={styles.paginationInfo}>
            <span>第 {pagination.page} 页，共 {pagination.totalPages} 页</span>
            <span>（共 {pagination.total} 条记录）</span>
          </div>
          
          <button 
            className={`${styles.paginationBtn} ${!pagination.hasNext ? styles.disabled : ''}`}
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            下一页
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}