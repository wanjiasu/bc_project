import {
  FiActivity,
  FiAward,
  FiGift,
  FiLink,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiSend,
  FiBox,
  FiStar,
  FiFilter,
  FiFileText,
  FiHeart,
  FiX,
} from "react-icons/fi"

import { auth } from "auth"
import { fetchTopAiRecommendations } from "src/lib/postgres"
import type { AiHighlight } from "src/lib/postgres"
import { UserMenuServerWrapper } from "src/components/Header/UserMenuServerWrapper"
import { AiHighlightsSection } from "./components/AiHighlightsSection"
import { BestBetsSection } from "./components/BestBetsSection"
import MatchesTable from "./components/MatchesTable"
import PageClient from "./PageClient"
import styles from "./page.module.scss"

const navItems = [
  { label: "AI 最佳推荐", href: "#best" },
  { label: "全部比赛", href: "#all" },
  { label: "内容中心", href: "#seo" },
  { label: "活动", href: "#promos" },
]

// 添加新的数据结构 - 更新为匹配 API 返回格式
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

const matches = [
  {
    id: 'e1',
    ts: Date.now() + 2 * 3600000,
    sport: 'soccer',
    region: 'TH',
    league: 'THA League 1',
    home: 'Buriram',
    away: 'BG Pathum',
    odds: [1.95, 3.30, 3.70],
    ai: '主胜 61%'
  },
  {
    id: 'e2',
    ts: Date.now() + 9 * 3600000,
    sport: 'soccer',
    region: 'BR',
    league: 'Série A',
    home: 'Flamengo',
    away: 'Palmeiras',
    odds: [2.10, 3.10, 3.20],
    ai: '主胜 DNB 58%'
  },
  {
    id: 'e3',
    ts: Date.now() + 5 * 3600000,
    sport: 'esports',
    region: 'SEA',
    league: 'LOL LCK',
    home: 'GenG',
    away: 'T1',
    odds: [1.80, '-', 2.00],
    ai: 'GenG -1.5 57%'
  },
  {
    id: 'e4',
    ts: Date.now() + 26 * 3600000,
    sport: 'basketball',
    region: 'MX',
    league: 'Liga Nacional',
    home: 'CDMX',
    away: 'Monterrey',
    odds: [1.85, '-', 2.05],
    ai: '大分 210.5 54%'
  },
  {
    id: 'e5',
    ts: Date.now() + 1 * 3600000,
    sport: 'tennis',
    region: 'AR',
    league: 'ATP Challenger',
    home: 'Diaz',
    away: 'Gomez',
    odds: [1.70, '-', 2.20],
    ai: '主胜 56%'
  }
]

const articles = [
  {
    id: 201,
    title: '[TH] 今晚 3 场性价比汇总',
    tag: ['Value', '等效赔率'],
    date: new Date().toISOString()
  },
  {
    id: 202,
    title: '[BR Série A] 主胜价值票：弗拉门戈 vs 帕尔梅拉斯',
    tag: ['主胜', '盘口背离'],
    date: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 203,
    title: '[电竞] 今日 2 场稳胆 & 1 场冷门',
    tag: ['LOL', 'CS2'],
    date: new Date(Date.now() - 7200000).toISOString()
  }
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
      fixtureDate: "时间待定",
      comment: "AI 参考近期 xG（2.1 vs 1.2）与高压迫抢回率。市场高估德比波动；主胜具备价值。",
      market: "推荐盘口 · FT 1X2",
      pick: "Home",
      averageOdds: "Home: 2.32 / Draw: 3.69 / Away: 2.44",
      probabilities: [],
      confidence: 87,
      homeTeam: "Liverpool",
      awayTeam: "Man United",
      fixtureId: "fixture-fallback-1",
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
    fixtureId: item.fixtureId ?? (typeof item.id === "string" ? item.id : null),
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
    <PageClient user={session?.user ?? null}>
      <main>
        {/* AI Best Bets */}
        <BestBetsSection />

        {/* All Matches */}
        <section id="all" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FiFilter size={20} /> 全部比赛
            </h2>
            <label className={styles.favFilter}>
              <input type="checkbox" /> 只看关注
            </label>
          </div>

          {/* Filters */}
          <div className={styles.filtersCard}>
            <div className={styles.filtersGrid}>
              <div>
                <div className={styles.filterLabel}>运动</div>
                <select className={styles.filterSelect}>
                  <option value="">全部</option>
                  <option>soccer</option>
                  <option>basketball</option>
                  <option>esports</option>
                  <option>tennis</option>
                </select>
              </div>
              <div>
                <div className={styles.filterLabel}>地区</div>
                <select className={styles.filterSelect}>
                  <option value="">全部</option>
                  <option>TH</option>
                  <option>ID</option>
                  <option>VN</option>
                  <option>MY</option>
                  <option>BR</option>
                  <option>MX</option>
                  <option>AR</option>
                </select>
              </div>
              <div>
                <div className={styles.filterLabel}>时间</div>
                <select className={styles.filterSelect}>
                  <option value="">全部</option>
                  <option value="today">今天</option>
                  <option value="24h">24 小时内</option>
                </select>
              </div>
              <div>
                <div className={styles.filterLabel}>联赛</div>
                <input className={styles.filterInput} placeholder="THA L1 / Série A / UCL" />
              </div>
              <div>
                <div className={styles.filterLabel}>搜索</div>
                <input className={styles.filterInput} placeholder="队名/盘口" />
              </div>
            </div>
          </div>

          {/* Matches Table */}
          <MatchesTable />
        </section>

        {/* SEO Content Hub */}
        <section id="seo" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FiFileText size={20} /> 内容中心（SEO）
            </h2>
            <div className={styles.sectionNote}>支持自动更新到此区域</div>
          </div>
          <div className={styles.articlesGrid}>
            {articles.map((article) => (
              <a key={article.id} href="#" className={styles.articleCard}>
                <div className={styles.articleDate}>
                  {new Date(article.date).toLocaleString()}
                </div>
                <div className={styles.articleTitle}>{article.title}</div>
                <div className={styles.articleTags}>
                  {article.tag.map((tag) => (
                    <span key={tag} className={styles.chip}>
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </PageClient>
  )
}
