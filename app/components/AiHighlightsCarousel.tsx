"use client"

import { useMemo, useState } from "react"

import {
  FiActivity,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
} from "react-icons/fi"

import styles from "../page.module.scss"

type Highlight = {
  id: string
  title: string
  matchTime: string | null
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
    offer?: string | null
  }[]
}

const fallbackProbabilities = [
  { label: "主胜", value: "2.32" },
  { label: "平局", value: "3.69" },
  { label: "客胜", value: "2.44" },
]

const formatMatchTime = (iso: string | null) => {
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

const parseAverageOdds = (averageOdds: string | null) => {
  if (!averageOdds) return fallbackProbabilities

  const parts = averageOdds.split(/[\/、，,]+/)
  const entries: { label: string; value: string }[] = []

  for (const part of parts) {
    const match = part.match(/([^:：]+)[:：]\s*([0-9]*\.?[0-9]+)/)
    if (match) {
      const rawLabel = match[1].trim()
      const odds = match[2].trim()
      let label = rawLabel
      if (/home|主/i.test(rawLabel)) label = "主胜"
      else if (/away|客/i.test(rawLabel)) label = "客胜"
      else if (/draw|平/i.test(rawLabel)) label = "平局"
      entries.push({ label, value: odds })
    }
  }

  return entries.length ? entries : fallbackProbabilities
}

export const AiHighlightsCarousel = ({ highlights }: { highlights: Highlight[] }) => {
  const data = useMemo(() => (highlights.length ? highlights : []), [highlights])
  const [index, setIndex] = useState(0)

  if (!data.length) return null

  const current = data[Math.min(index, data.length - 1)]
  const probabilityFallback = current.averageOdds ? parseAverageOdds(current.averageOdds) : fallbackProbabilities
  const probabilities = (current.probabilities?.length ? current.probabilities : probabilityFallback).slice(0, 3)
  const institutionOdds = current.institutionOdds?.length ? current.institutionOdds : []

  const goPrev = () => {
    setIndex((prev) => (prev === 0 ? data.length - 1 : prev - 1))
  }

  const goNext = () => {
    setIndex((prev) => (prev + 1) % data.length)
  }

  return (
    <div className={styles.aiCarousel}>
      <div id="ai" className={styles.aiCard}>
        <div className={styles.aiCardHeader}>
          <div className={styles.aiCardHeading}>
            <FiActivity size={18} />
            <span>今日 AI 重点</span>
          </div>
          <span className={styles.aiCardTag}>
            {current.confidence != null ? `信心 ${current.confidence}%` : "AI 推荐"}
          </span>
        </div>
        <h3>{current.title ?? "AI 推荐赛事"}</h3>
        <p>{`开赛时间：${formatMatchTime(current.matchTime)}`}</p>

        <div className={styles.aiCardProbabilities}>
          {probabilities.map(({ label, value }) => (
            <div key={label}>
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>

        <div className={styles.aiRecommendation}>
          <span>{current.market ?? "推荐盘口"}</span>
          {current.pick ? <strong>{current.pick}</strong> : null}
          {current.comment ? <p>{current.comment}</p> : <p>数据加载中…</p>}
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

      {data.length > 1 ? (
        <div className={styles.aiCarouselNav}>
          <div className={styles.aiNavButtons}>
            <button
              type="button"
              className={styles.aiNavButton}
              onClick={goPrev}
              aria-label="上一场"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.aiNavButton}
              onClick={goNext}
              aria-label="下一场"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
          <span className={styles.aiCarouselIndex}>
            {String(index + 1).padStart(2, "0")} / {String(data.length).padStart(2, "0")}
          </span>
        </div>
      ) : null}
    </div>
  )
}
