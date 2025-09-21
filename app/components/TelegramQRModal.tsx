'use client'

import { useEffect, useRef, useState } from 'react'
import { FiX, FiExternalLink } from 'react-icons/fi'
import QRCode from 'qrcode'
import styles from './TelegramQRModal.module.scss'

interface TelegramQRModalProps {
  isOpen: boolean
  onClose: () => void
  telegramUrl?: string
}

export default function TelegramQRModal({ 
  isOpen, 
  onClose, 
  telegramUrl = 'https://t.me/betaionetest_bot?start=right' 
}: TelegramQRModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && telegramUrl) {
      generateQRCode()
    }
  }, [isOpen, telegramUrl])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(telegramUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('生成二维码失败:', error)
    }
  }

  const handleDirectOpen = () => {
    window.open(telegramUrl, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>添加 Telegram 机器人</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.qrSection}>
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="Telegram 机器人二维码" 
                className={styles.qrCode}
              />
            ) : (
              <div className={styles.qrPlaceholder}>
                <div className={styles.loading}>生成二维码中...</div>
              </div>
            )}
          </div>
          
          <div className={styles.instructions}>
            <h3>使用方法：</h3>
            <ol>
              <li>使用手机 Telegram 扫描上方二维码</li>
              <li>或者点击下方按钮直接打开</li>
              <li>点击 "Start" 开始与机器人对话</li>
              <li>获取专属的 AI 投注建议和实时提醒</li>
            </ol>
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.directButton}
              onClick={handleDirectOpen}
            >
              <FiExternalLink size={16} />
              直接打开 Telegram
            </button>
          </div>
          
          <div className={styles.footer}>
            <p className={styles.note}>
              * 需要先安装 Telegram 应用
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}