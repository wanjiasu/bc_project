'use client'

import { useState, useEffect } from 'react'
import { FiStar, FiSend } from 'react-icons/fi'
import styles from '../page.module.scss'

type BestBetData = {
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

export function BestBetsSection() {
  const [bestBets, setBestBets] = useState<BestBetData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBestBets() {
      try {
        const response = await fetch('/api/best-bets')
        if (!response.ok) {
          throw new Error('Failed to fetch best bets')
        }
        const data = await response.json()
        setBestBets(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBestBets()
  }, [])

  // 根据 predicted_result 确定哪个队伍应该高亮
  const getHighlightedTeam = (predictedResult: string, homeTeam: string, awayTeam: string) => {
    const result = predictedResult.toLowerCase()
    if (result.includes('home') || result.includes('主')) {
      return 'home'
    } else if (result.includes('away') || result.includes('客')) {
      return 'away'
    }
    return 'none'
  }

  // 格式化平均赔率显示
  const formatAverageOdds = (odds: { Home: number; Draw: number; Away: number }) => {
    // 防御性编程，处理可能的 undefined 值
    const home = odds?.Home || 0
    const draw = odds?.Draw || 0
    const away = odds?.Away || 0
    
    return `主 ${home.toFixed(2)} / 平 ${draw.toFixed(2)} / 客 ${away.toFixed(2)}`
  }

  if (loading) {
    return (
      <section id="best" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FiStar size={20} /> AI 最有把握的投注
          </h2>
          <div className={styles.sectionNote}>加载中...</div>
        </div>
        <div className={styles.bestBetsGrid}>
          <div className={styles.bestBetCard}>
            <div className={styles.loading}>正在获取最新推荐...</div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="best" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FiStar size={20} /> AI 最有把握的投注
          </h2>
          <div className={styles.sectionNote}>加载失败：{error}</div>
        </div>
      </section>
    )
  }

  return (
    <section id="best" className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <FiStar size={20} /> AI 最有把握的投注
        </h2>
        <div className={styles.sectionNote}>实时数据（来自 PostgreSQL）</div>
      </div>
      <div className={styles.bestBetsGrid}>
        {bestBets.map((bet) => {
          const highlightedTeam = getHighlightedTeam(bet.predicted_result, bet.home_team, bet.away_team)
          
          return (
            <div key={bet.id} className={styles.bestBetCard}>
              {/* League Name */}
              <div className={styles.betLeague}>
                {bet.league_name}
              </div>
              
              {/* Home vs Away with highlighting */}
              <div className={styles.betTeams}>
                <span className={highlightedTeam === 'home' ? styles.highlightedTeam : ''}>
                  {bet.home_team}
                </span>
                <span className={styles.vs}> vs </span>
                <span className={highlightedTeam === 'away' ? styles.highlightedTeam : ''}>
                  {bet.away_team}
                </span>
              </div>
              
              {/* Average Odds */}
              <div className={styles.betOdds}>
                {bet.average_odds ? formatAverageOdds(bet.average_odds) : '赔率暂无'}
              </div>
              
              {/* Recommendation Comment */}
              <div className={styles.betComment}>
                {bet.recommendation_comment}
              </div>
              
              {/* Recommendation Index */}
              <div className={styles.betStats}>
                <span className={styles.chip}>推荐指数 {bet.recommendation_index}</span>
                <span className={styles.chip}>预测结果: {bet.predicted_result}</span>
              </div>
              
              <div className={styles.betActions}>
                <button className={styles.primaryCta}>去下注（最划算）</button>
                <a href="https://t.me/" className={styles.secondaryAction}>
                  <FiSend size={16} /> 让 AI 跟单
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}