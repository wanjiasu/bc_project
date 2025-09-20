import {
  FiActivity,
  FiAward,
  FiGift,
  FiLink,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"

import { auth } from "auth"
import { fetchTopAiRecommendations } from "src/lib/postgres"
import type { AiHighlight } from "src/lib/postgres"
import { UserMenuServerWrapper } from "src/components/Header/UserMenuServerWrapper"
import { AiHighlightsSection } from "./components/AiHighlightsSection"
import styles from "./page.module.scss"

const navItems = [
  { label: "AI 预测", href: "#ai" },
  { label: "赔率对比", href: "#odds" },
  { label: "羊毛中心", href: "#promos" },
  { label: "比分&赛程", href: "#scores" },
  { label: "加入社群", href: "#social" },
]

const heroMetrics = [
  { label: "近7日命中率*", value: "63%", icon: "trend" as const },
  { label: "私域用户", value: "3,214", icon: "users" as const },
  { label: "覆盖渠道", value: "8+", icon: "coverage" as const },
  { label: "风控模型", value: "Beta", icon: "shield" as const },
]

const fallbackOddsVendors = [
  {
    name: "GG.bet",
    offer: "即时赔率",
    home: "1.78",
    draw: "3.90",
    away: "4.40",
  },
  {
    name: "1xBet",
    offer: "即时赔率",
    home: "1.80",
    draw: "3.85",
    away: "4.35",
  },
  {
    name: "Parimatch",
    offer: "即时赔率",
    home: "1.76",
    draw: "3.95",
    away: "4.50",
  },
  {
    name: "Thunderpick",
    offer: "即时赔率",
    home: "1.79",
    draw: "3.88",
    away: "4.42",
  },
]

const promotions = [
  {
    tag: "Esports",
    brand: "GG.bet",
    title: "100% 首充加赠",
    description: "注册即享，电竞专属",
    action: "领取",
  },
  {
    tag: "Football",
    brand: "1xBet",
    title: "$30 免费注单",
    description: "新客福利，支持串关",
    action: "领取",
  },
  {
    tag: "All Sports",
    brand: "Parimatch",
    title: "10% 现金返还",
    description: "周赛累计返利",
    action: "参加",
  },
  {
    tag: "Crypto",
    brand: "Thunderpick",
    title: "+10% 加密充值",
    description: "USDT/ETH 即时到账",
    action: "充值",
  },
]

const scoreCards = [
  {
    league: "THA League 1",
    teams: ["Buriram Utd", "BG Pathum"],
    status: "LIVE 31'",
    score: "1 - 0",
    time: "19:00",
  },
  {
    league: "Brazil Serie A",
    teams: ["Flamengo", "Palmeiras"],
    status: "Today",
    score: "-",
    time: "07:30",
  },
  {
    league: "LoL LLA",
    teams: ["INF", "EST"],
    status: "Bo5",
    score: "-",
    time: "17:00",
  },
]

const socialPills = [
  { label: "玩家福利", value: "每日羊毛" },
  { label: "AI 预测", value: "胜率 & 趋势" },
  { label: "代理支持", value: "内容+分佣" },
]

export default async function Page() {
  const session = await auth()
  const aiRecommendations = await fetchTopAiRecommendations(3)

  const fallbackRecommendations: AiHighlight[] = [
    {
      id: "fallback-1",
      title: "Liverpool vs. Man United",
      matchTime: null,
      comment: "AI 参考近期 xG（2.1 vs 1.2）与高压迫抢回率。市场高估德比波动；主胜具备价值。",
      market: "推荐盘口 · FT 1X2",
      pick: "Home",
      averageOdds: "Home: 2.32 / Draw: 3.69 / Away: 2.44",
      probabilities: [],
      confidence: 87,
      homeTeam: "Liverpool",
      awayTeam: "Man United",
      institutionOdds: [
        {
          name: "10Bet",
          home: "3.20",
          draw: "3.40",
          away: "1.95",
          offer: null,
        },
        {
          name: "William Hill",
          home: "3.10",
          draw: "3.50",
          away: "2.00",
          offer: null,
        },
      ],
    },
  ]

  const highlights = aiRecommendations.length ? aiRecommendations : fallbackRecommendations
  const carouselHighlights = highlights.map((item) => ({
    ...item,
    matchTime: item.matchTime ? item.matchTime.toISOString() : null,
    institutionOdds:
      item.institutionOdds?.map((entry) => ({
        name: entry.name,
        home: entry.home ?? null,
        draw: entry.draw ?? null,
        away: entry.away ?? null,
        offer: entry.offer ?? null,
      })) ?? [],
  }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoBadge}>AI</span>
            <span>SmartBet Hub</span>
            <span className={`${styles.logoTag} ${styles.hideOnMobile}`}>MVP</span>
          </div>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <a key={item.label} className={styles.navLink} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <UserMenuServerWrapper user={session?.user ?? null} />
        </div>
      </header>

      <main>
        <AiHighlightsSection
          highlights={carouselHighlights}
          metrics={heroMetrics}
          fallbackOdds={fallbackOddsVendors}
        />

        <section id="promos" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FiGift size={20} /> 羊毛中心 · 今日福利
            </h2>
          </div>
          <div className={styles.promotionsGrid}>
            {promotions.map((promo) => (
              <div key={promo.title} className={styles.promoCard}>
                <div className={styles.promoMeta}>
                  <span className={styles.chip}>{promo.tag}</span>
                  <span>{promo.brand}</span>
                </div>
                <div>
                  <div className={styles.promoTitle}>{promo.title}</div>
                  <p>{promo.description}</p>
                </div>
                <a href="#" className={styles.promoAction}>
                  {promo.action}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="scores" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FiActivity size={20} /> 实时比分 &amp; 赛程
            </h2>
          </div>
          <div className={styles.scoresGrid}>
            {scoreCards.map((card) => (
              <div key={card.league} className={styles.scoreCard}>
                <div className={styles.scoreMeta}>{card.league}</div>
                <div className={styles.scoreMatch}>
                  <div className={styles.scoreTeams}>
                    {card.teams.map((team) => (
                      <span key={team}>{team}</span>
                    ))}
                  </div>
                  <div className={styles.scoreInfo}>
                    <span className={styles.metricLabel}>{card.status}</span>
                    <strong>{card.score}</strong>
                    <span className={styles.metricLabel}>{card.time}</span>
                  </div>
                </div>
                <a href="#" className={styles.promoAction}>
                  查看盘口
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="social" className={styles.section}>
          <div className={styles.socialSection}>
            <div className={styles.socialCard}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <FiLink size={20} /> 加入社群 &amp; 代理计划
                </h3>
                <p>
                  Line / Telegram / WhatsApp 一键加入，获取每日 AI 预测与独家福利。成为代理可获得分佣、专属内容包与私域运营支持。
                </p>
                <div className={styles.socialActions}>
                  <a href="#" className={styles.primaryBtn}>
                    加入玩家社群
                  </a>
                  <a href="#" className={styles.secondaryBtn}>
                    申请成为代理
                  </a>
                </div>
              </div>
              <div className={styles.socialPills}>
                {socialPills.map((pill) => (
                  <div key={pill.label} className={styles.socialPill}>
                    <div className={styles.metricLabel}>{pill.label}</div>
                    <div className={styles.metricValue}>{pill.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.logo}>
              <span className={styles.logoBadge}>AI</span>
              <span>SmartBet Hub</span>
              <span className={styles.logoTag}>Beta</span>
            </div>
            <div className={styles.footerLinks}>
              {navItems.map((item) => (
                <a key={`footer-${item.label}`} className={styles.navLink} href={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className={styles.disclaimer}>
            本页面为产品原型，所有数据为示例。请遵循当地法律与责任博彩规范（18+）。
          </div>
        </div>
      </footer>
    </div>
  )
}
