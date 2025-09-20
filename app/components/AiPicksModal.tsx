"use client"

import { useState, useEffect } from "react"
import styles from "./AiPicksModal.module.css"

export interface AiPick {
  id: string
  fixtureId: string | null
  aiResponse: any
  homeTeam: string | null
  awayTeam: string | null
  market: string | null
  pick: string | null
  comment: string | null
  confidence: number | null
  averageOdds: string | null
  createdAt: string
}

interface AiPicksModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPick: (pick: AiPick) => void
}

export default function AiPicksModal({ isOpen, onClose, onSelectPick }: AiPicksModalProps) {
  const [picks, setPicks] = useState<AiPick[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchAiPicks()
    }
  }, [isOpen])

  const fetchAiPicks = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/ai-picks")
      if (!response.ok) {
        throw new Error("Failed to fetch AI picks")
      }
      
      const data = await response.json()
      setPicks(data.picks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPick = (pick: AiPick) => {
    onSelectPick(pick)
    onClose()
  }

  const formatTeamNames = (homeTeam: string | null, awayTeam: string | null) => {
    if (!homeTeam && !awayTeam) return "未知对阵"
    if (!homeTeam) return `vs ${awayTeam}`
    if (!awayTeam) return `${homeTeam} vs`
    return `${homeTeam} vs ${awayTeam}`
  }

  const formatConfidence = (confidence: number | null) => {
    if (confidence == null) return "未知"
    return `${Math.round(confidence)}%`
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>AI Picks 推荐</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>加载中...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>错误: {error}</p>
              <button onClick={fetchAiPicks} className={styles.retryButton}>
                重试
              </button>
            </div>
          )}

          {!loading && !error && picks.length === 0 && (
            <div className={styles.empty}>
              <p>暂无推荐赛事</p>
            </div>
          )}

          {!loading && !error && picks.length > 0 && (
            <div className={styles.picksList}>
              {picks.map((pick) => (
                <div
                  key={pick.id}
                  className={styles.pickItem}
                  onClick={() => handleSelectPick(pick)}
                >
                  <div className={styles.pickHeader}>
                    <h3 className={styles.matchup}>
                      {formatTeamNames(pick.homeTeam, pick.awayTeam)}
                    </h3>
                    <span className={styles.confidence}>
                      信心度: {formatConfidence(pick.confidence)}
                    </span>
                  </div>

                  <div className={styles.pickDetails}>
                    {pick.market && (
                      <div className={styles.market}>
                        <span className={styles.label}>市场:</span>
                        <span className={styles.value}>{pick.market}</span>
                      </div>
                    )}
                    
                    {pick.pick && (
                      <div className={styles.pick}>
                        <span className={styles.label}>推荐:</span>
                        <span className={styles.value}>{pick.pick}</span>
                      </div>
                    )}
                    
                    {pick.averageOdds && (
                      <div className={styles.odds}>
                        <span className={styles.label}>平均赔率:</span>
                        <span className={styles.value}>{pick.averageOdds}</span>
                      </div>
                    )}
                  </div>

                  {pick.comment && (
                    <div className={styles.comment}>
                      <p>{pick.comment}</p>
                    </div>
                  )}

                  <div className={styles.fixtureId}>
                    Fixture ID: {pick.fixtureId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
