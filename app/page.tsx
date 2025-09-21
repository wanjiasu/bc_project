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
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoBadge}>β</span>
            <span>Betaione</span>
            <span className={`${styles.logoTag} ${styles.hideOnMobile}`}>Demo</span>
          </div>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <a key={item.label} className={styles.navLink} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className={styles.ctaGroup}>
            <select className={`${styles.langSelect} ${styles.hideOnMobile}`}>
              <option>简体中文</option>
              <option>English</option>
              <option>ไทย</option>
              <option>Bahasa</option>
              <option>Português (BR)</option>
              <option>Español</option>
            </select>
            <UserMenuServerWrapper user={session?.user ?? null} />
            <a href="#" className={styles.primaryCta}>
              免费开始
            </a>
          </div>
        </div>
      </header>

      {/* Promo Banners */}
      <section id="promos" className={styles.promoBanners}>
        <div className={styles.container}>
          <div className={styles.bannersGrid}>
            <div className={styles.promoBanner}>
              <div>
                <div className={styles.bannerTag}>AI 投注助理</div>
                <div className={styles.bannerTitle}>添加 Telegram，领专属下注建议</div>
                <div className={styles.bannerSub}>赛前提醒 · 实时盘口变动 · 风险提示</div>
              </div>
              <a href="https://t.me/" className={styles.primaryCta}>
                <FiSend size={16} /> 立即添加
              </a>
            </div>
            <div className={styles.promoBanner}>
              <div>
                <div className={styles.bannerTag}>每周关注抽奖</div>
                <div className={styles.bannerTitle}>关注 Facebook，周周送福利</div>
                <div className={styles.bannerSub}>关注即可参与 · 实名后自动加权</div>
              </div>
              <a href="https://facebook.com/" className={styles.secondaryAction}>
                <FiGift size={16} /> 去关注
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>所有比赛 · 一站式可下注</h1>
            <p className={styles.heroDescription}>
              聚合主流联赛与电竞盘口，<strong>AI 给出"最有把握"投注建议</strong>，并提示"最划算渠道"。
            </p>
          </div>
          <aside className={styles.aiCard}>
            <div className={styles.aiCardHeading}>AI 投注助理（Telegram）</div>
            <p>把你关注的球队加到清单，AI 会根据盘口变动和历史模型，推送合适的下注窗口。</p>
            <div className={styles.heroActions}>
              <a href="https://t.me/" className={styles.primaryAction}>
                <FiBox size={16} /> 添加 Telegram
              </a>
              <a href="https://facebook.com/" className={styles.secondaryAction}>
                <FiLink size={16} /> 关注 Facebook 抽奖
              </a>
            </div>
            <p className={styles.heroFootnote}>* 演示页。请遵循当地法律与 18+ 责任博彩。</p>
          </aside>
        </div>
      </section>

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
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>{new Date(match.ts).toTimeString().slice(0, 5)}</td>
                    <td>{match.sport}</td>
                    <td>{match.league}</td>
                    <td>
                      <button className={styles.favBtn}>
                        <FiHeart size={16} />
                      </button>
                      <span className={styles.matchTeams}>
                        {match.home} <span>vs</span> {match.away}
                      </span>
                    </td>
                    <td>{match.odds[0] === '-' ? '-' : Number(match.odds[0]).toFixed(2)}</td>
                    <td>{match.odds[1] === '-' ? '-' : Number(match.odds[1]).toFixed(2)}</td>
                    <td>{match.odds[2] === '-' ? '-' : Number(match.odds[2]).toFixed(2)}</td>
                    <td>{match.ai}</td>
                    <td>
                      <button className={styles.dealBtn}>最划算渠道</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerContent}>
              <div className={styles.footerChips}>
                <span className={styles.chip}>18+ 责任博彩</span>
                <span className={styles.chip}>SEA & LATAM</span>
                <a className={styles.chip} href="https://t.me/">
                  Telegram
                </a>
                <a className={styles.chip} href="https://facebook.com/">
                  Facebook
                </a>
              </div>
              <div className={styles.disclaimer}>演示页面 · 数据为示例 · 请遵循当地法律</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
