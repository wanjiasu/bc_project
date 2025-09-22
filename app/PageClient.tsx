'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  FiSend,
  FiBox,
  FiLink,
  FiGift,
} from "react-icons/fi"
import type { User } from "next-auth"
import TelegramQRModal from "./components/TelegramQRModal"
import { UserMenuServerWrapper } from "src/components/Header/UserMenuServerWrapper"
import styles from "./page.module.scss"

interface PageClientProps {
  children: React.ReactNode
  user: User | null
}

export default function PageClient({ children, user }: PageClientProps) {
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false)
  const router = useRouter()

  // 调试日志：查看user对象和userId
  console.log('PageClient - user object:', user)
  console.log('PageClient - user.id:', user?.id)

  const handleTelegramClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    console.log('handleTelegramClick - user:', user)
    console.log('handleTelegramClick - user.id:', user?.id)
    
    // 检查用户是否已登录
    if (!user) {
      // 未登录，跳转到登录页面
      router.push('/login')
      return
    }
    
    // 已登录，显示Telegram二维码模态框
    setIsTelegramModalOpen(true)
  }

  return (
    <>
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
              <a className={styles.navLink} href="#best">AI 最佳推荐</a>
              <a className={styles.navLink} href="#all">全部比赛</a>
              <a className={styles.navLink} href="#seo">内容中心</a>
              <a className={styles.navLink} href="#promos">活动</a>
            </nav>
            <div className={styles.ctaGroup}>
              <UserMenuServerWrapper user={user} />
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
                <button onClick={handleTelegramClick} className={styles.primaryCta}>
                  <FiSend size={16} /> 立即添加
                </button>
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
                聚合主流联赛与电竞盘口，<strong>AI 给出&ldquo;最有把握&rdquo;投注建议</strong>，并提示&ldquo;最划算渠道&rdquo;。
              </p>
            </div>
            <aside className={styles.aiCard}>
              <div className={styles.aiCardHeading}>AI 投注助理（Telegram）</div>
              <p>把你关注的球队加到清单，AI 会根据盘口变动和历史模型，推送合适的下注窗口。</p>
              <div className={styles.heroActions}>
                <button onClick={handleTelegramClick} className={styles.primaryAction}>
                  <FiBox size={16} /> 添加 Telegram
                </button>
                <a href="https://facebook.com/" className={styles.secondaryAction}>
                  <FiLink size={16} /> 关注 Facebook 抽奖
                </a>
              </div>
              <p className={styles.heroFootnote}>* 演示页。请遵循当地法律与 18+ 责任博彩。</p>
            </aside>
          </div>
        </section>

        {/* Main content from server component */}
        {children}

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerTop}>
              <div className={styles.footerContent}>
                <div className={styles.footerChips}>
                  <span className={styles.chip}>18+ 责任博彩</span>
                  <span className={styles.chip}>SEA & LATAM</span>
                  <button onClick={handleTelegramClick} className={styles.chip}>
                    Telegram
                  </button>
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

      {/* Telegram QR Modal */}
      <TelegramQRModal 
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        userId={user?.id}
      />
    </>
  )
}