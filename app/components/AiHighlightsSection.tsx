"use client"

import { useEffect, useMemo, useState } from "react"

import {
  FiBarChart2,
  FiGlobe,
  FiPercent,
  FiZap,
  FiArrowRight,
  FiTrendingUp,
  FiUsers,
  FiAward,
  FiShield,
} from "react-icons/fi"
import type { IconType } from "react-icons"

import styles from "../page.module.scss"
import { AiHighlightsCarousel, Highlight } from "./AiHighlightsCarousel"
import AiPicksModal, { AiPick } from "./AiPicksModal"

type MetricIcon = "trend" | "users" | "coverage" | "shield"

type Metric = {
  label: string
  value: string
  icon: MetricIcon
}

type OddsVendor = {
  name: string
  offer: string | null
  home: string | null
  draw: string | null
  away: string | null
}

type AiHighlightsSectionProps = {
  highlights: Highlight[]
  metrics: Metric[]
  fallbackOdds: OddsVendor[]
}

const metricIconMap: Record<MetricIcon, IconType> = {
  trend: FiTrendingUp,
  users: FiUsers,
  coverage: FiAward,
  shield: FiShield,
}

const fallbackDisplayedOdds = [
  { label: "主胜", value: "2.32" },
  { label: "平局", value: "3.69" },
  { label: "客胜", value: "2.44" },
]

export const AiHighlightsSection = ({
  highlights,
  metrics,
  fallbackOdds,
}: AiHighlightsSectionProps) => {
  const [data, setData] = useState<Highlight[]>(() => (highlights.length ? highlights : []))
  const [activeIndex, setActiveIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const initial = highlights.length ? highlights : []
    setData(initial)
    setActiveIndex(0)
  }, [highlights])

  const total = data.length || 1
  const index = data.length ? ((activeIndex % total) + total) % total : 0
  const activeHighlight = data.length ? data[index] : null

  const fallbackTopOdds = useMemo(() => {
    if (fallbackOdds.length) {
      const [first] = fallbackOdds
      return [
        { label: "主胜", value: first.home ?? fallbackDisplayedOdds[0].value },
        { label: "平局", value: first.draw ?? fallbackDisplayedOdds[1].value },
        { label: "客胜", value: first.away ?? fallbackDisplayedOdds[2].value },
      ]
    }
    return fallbackDisplayedOdds
  }, [fallbackOdds])

  const displayedOdds = useMemo(() => {
    const topVendor = activeHighlight?.institutionOdds?.[0]
    if (topVendor) {
      return [
        { label: "主胜", value: topVendor.home ?? fallbackTopOdds[0].value },
        { label: "平局", value: topVendor.draw ?? fallbackTopOdds[1].value },
        { label: "客胜", value: topVendor.away ?? fallbackTopOdds[2].value },
      ]
    }
    if (activeHighlight?.probabilities?.length) {
      return activeHighlight.probabilities
    }
    return fallbackTopOdds
  }, [activeHighlight, fallbackTopOdds])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSelectPick = async (pick: AiPick) => {
    if (!pick.fixtureId) return
    try {
      const response = await fetch(`/api/fixture/${pick.fixtureId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch fixture data")
      }

      const { fixture } = await response.json()

      const newHighlight: Highlight = {
        id: fixture.id,
        title: `${fixture.homeTeam || "主队"} vs ${fixture.awayTeam || "客队"}`,
        matchTime: fixture.matchTime,
        fixtureDate: fixture.fixtureDate ?? fixture.matchTime ?? null,
        comment: fixture.comment,
        market: fixture.market,
        pick: fixture.pick,
        averageOdds: fixture.averageOdds,
        probabilities: fixture.probabilities ?? [],
        confidence: fixture.confidence,
        institutionOdds: fixture.institutionOdds ?? [],
        fixtureId: fixture.fixtureId ?? pick.fixtureId,
      }

      setData((prevData) => [
        newHighlight,
        ...prevData.filter((item) => item.fixtureId !== newHighlight.fixtureId),
      ])
      setActiveIndex(0)
    } catch (error) {
      console.error("Error loading selected fixture:", error)
    }
  }

  const oddsVendors = useMemo(() => {
    const vendors = activeHighlight?.institutionOdds?.length
      ? activeHighlight.institutionOdds
      : fallbackOdds

    return vendors.map((vendor) => ({
      name: vendor.name,
      offer: vendor.offer ?? "即时赔率",
      home: vendor.home ?? "-",
      draw: vendor.draw ?? "-",
      away: vendor.away ?? "-",
    }))
  }, [activeHighlight?.institutionOdds, fallbackOdds])

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              下注之前，先看 <span className={styles.gradText}>AI 怎么说</span>
            </h1>
            <p className={styles.heroDescription}>
              一站式 <strong>AI 预测</strong>、<strong>赔率对比</strong> 与 <strong>羊毛福利</strong>
              聚合。东南亚 &amp; 南美玩家的智能下注第一入口。
            </p>
            <div className={styles.heroActions}>
              <button 
                onClick={handleOpenModal}
                className={`${styles.primaryAction} ${styles.heroButton}`}
              >
                <FiZap size={16} /> 立即查看今日 AI Picks
              </button>
              <a href="#promos" className={`${styles.secondaryAction} ${styles.heroButton}`}>
                <FiPercent size={16} /> 进入羊毛中心
              </a>
            </div>
            <div className={styles.metrics}>
              {metrics.map(({ label, value, icon }) => {
                const Icon = metricIconMap[icon] ?? FiAward
                return (
                  <div key={label} className={styles.metric}>
                    <span className={styles.metricIcon}>
                      <Icon size={20} />
                    </span>
                    <span>
                      <span className={styles.metricLabel}>{label}</span>
                      <span className={styles.metricValue}>{value}</span>
                    </span>
                  </div>
                )
              })}
            </div>
            <p className={styles.heroFootnote}>*示例数据，仅作展示</p>
          </div>

         <AiHighlightsCarousel
           highlight={activeHighlight ?? null}
            displayedOdds={displayedOdds}
            index={index}
            total={total}
            onPrev={() =>
              setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1))
            }
            onNext={() =>
              setActiveIndex((prev) => (prev + 1) % total)
            }
            onOpenModal={handleOpenModal}
          />
        </div>
      </section>

      <section id="odds" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTop}>
            <h2 className={styles.sectionTitle}>
              <FiBarChart2 size={20} /> 赔率对比
            </h2>
            <div className={styles.searchGroup}>
              <input
                className={styles.searchInput}
                placeholder="搜索赛事 / 联赛"
                type="text"
              />
              <button className={styles.primaryBtn} type="button">
                搜索
              </button>
            </div>
          </div>
        </div>
        <div className={styles.oddsGrid}>
          {oddsVendors.map((book) => (
            <div key={book.name} className={styles.oddsCard}>
              <div className={styles.oddsCardHeader}>
                <span className={styles.cardTitle}>
                  <FiGlobe size={18} /> {book.name}
                </span>
                <span className={`${styles.chip} ${styles.smallChip}`}>
                  {book.offer ?? "即时赔率"}
                </span>
              </div>
              <div className={styles.oddsValues}>
                {[
                  { label: "主胜", value: book.home },
                  { label: "平局", value: book.draw },
                  { label: "客胜", value: book.away },
                ].map((value) => (
                  <div key={`${book.name}-${value.label}`} className={styles.oddsValue}>
                    <div className={styles.oddsLabel}>{value.label}</div>
                    <div className={styles.oddsNumber}>{value.value ?? "-"}</div>
                  </div>
                ))}
              </div>
              <a href="#" className={styles.cardButton}>
                通过我们去下注 <FiArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </section>

      <AiPicksModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectPick={handleSelectPick}
      />
    </>
  )
}
