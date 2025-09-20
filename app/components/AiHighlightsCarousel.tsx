"use client"

import {
  FiActivity,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
} from "react-icons/fi"

import styles from "../page.module.scss"

export type Highlight = {
  id: string
  title: string
  matchTime: string | null
  fixtureDate: string | null
  comment: string | null
  market: string | null
  pick: string | null
  averageOdds: string | null
  probabilities: { label: string; value: string }[]
  confidence: number | null
  institutionOdds: {
    name: string
    home: string | null
    draw: string | null
    away: string | null
    offer: string | null
  }[]
}

const fallbackDisplayedOdds = [
  { label: "主胜", value: "2.32" },
  { label: "平局", value: "3.69" },
  { label: "客胜", value: "2.44" },
]

const formatMatchTime = (iso: string | null, fixtureDate: string | null) => {
  // 优先使用fixtureDate，如果它包含"时间待定"则直接返回
  if (fixtureDate && fixtureDate.includes("时间待定")) {
    return fixtureDate
  }
  
  // 如果fixtureDate存在且不包含"时间待定"，尝试解析它
  if (fixtureDate) {
    const date = new Date(fixtureDate)
    if (!Number.isNaN(date.getTime())) {
      try {
        return new Intl.DateTimeFormat("zh-CN", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date)
      } catch {
        // 如果格式化失败，继续使用原始fixtureDate
        return fixtureDate
      }
    }
  }
  
  // 回退到使用matchTime
  if (!iso) return "时间待定"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "时间待定"
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  } catch {
    return "时间待定"
  }
}

type AiHighlightsCarouselProps = {
  highlight: Highlight | null
  displayedOdds?: { label: string; value: string }[]
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export const AiHighlightsCarousel = ({
  highlight,
  displayedOdds = fallbackDisplayedOdds,
  index,
  total,
  onPrev,
  onNext,
}: AiHighlightsCarouselProps) => {
  const odds = displayedOdds.length ? displayedOdds : fallbackDisplayedOdds
  const safeIndex = total > 0 ? ((index % total) + total) % total : 0
  const showNavigation = total > 1

  return (
    <div className={styles.aiCarousel}>
      <div id="ai" className={styles.aiCard}>
        <div className={styles.aiCardHeader}>
          <div className={styles.aiCardHeading}>
            <FiActivity size={18} />
            <span>今日 AI 重点</span>
          </div>
          <span className={styles.aiCardTag}>
            {highlight?.confidence != null ? `信心 ${highlight.confidence}%` : "AI 推荐"}
          </span>
        </div>
        <h3>{highlight?.title ?? "AI 推荐赛事"}</h3>
        <p>{`开赛时间：${formatMatchTime(highlight?.matchTime ?? null, highlight?.fixtureDate ?? null)}`}</p>

        <div className={styles.aiCardProbabilities}>
          {odds.map(({ label, value }) => (
            <div key={label}>
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>

        <div className={styles.aiRecommendation}>
          <span>{highlight?.market ?? "推荐盘口"}</span>
          {highlight?.pick ? <strong>{highlight.pick}</strong> : null}
          {highlight?.comment ? <p>{highlight.comment}</p> : <p>数据加载中…</p>}
        </div>

        <div className={styles.aiCardActions}>
          <a href="#ai" className={`${styles.aiButton} ${styles.primaryAction}`}>
            <FiStar size={16} /> 更多 AI Picks
          </a>
          <a href="#ai" className={`${styles.aiButton} ${styles.secondaryAction}`}>
            <FiBarChart2 size={16} /> 历史命中
          </a>
        </div>
      </div>

      {showNavigation ? (
        <div className={styles.aiCarouselNav}>
          <div className={styles.aiNavButtons}>
            <button
              type="button"
              className={styles.aiNavButton}
              onClick={onPrev}
              aria-label="上一场"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.aiNavButton}
              onClick={onNext}
              aria-label="下一场"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
          <span className={styles.aiCarouselIndex}>
            {String(safeIndex + 1).padStart(2, "0")} / {String(total || 1).padStart(2, "0")}
          </span>
        </div>
      ) : null}
    </div>
  )
}
