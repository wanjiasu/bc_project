"use client"

import { useEffect, useState } from "react"

import type { User } from "next-auth"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

import styles from "./UserMenu.module.scss"

import { getInitials } from "./utils"

type UserMenuProps = {
  initialUser: User | null
}

export const UserMenu = ({ initialUser }: UserMenuProps) => {
  const { data: session } = useSession({ required: false })
  const user = session?.user ?? initialUser
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return
      if (!open) return
      const menu = document.getElementById("header-user-menu")
      if (menu && !menu.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("click", onClick)
    return () => {
      document.removeEventListener("click", onClick)
    }
  }, [open])

  if (!user) {
    return (
      <div className={styles.menuActions}>
        <Link href="/login" className={styles.secondaryCta}>
          登录
        </Link>
        <a href="#ai" className={styles.primaryCta}>
          免费使用
        </a>
      </div>
    )
  }

  return (
    <div className={styles.menuContainer} id="header-user-menu">
      <button
        type="button"
        className={styles.userBadge}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? user.email ?? "avatar"}
            className={styles.userAvatar}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.userInitials}>{getInitials(user.name, user.email)}</span>
        )}
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name ?? user.email ?? "已登录"}</span>
          {user.email ? <span className={styles.userEmail}>{user.email}</span> : null}
        </div>
      </button>
      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownBody}>
            <p className={styles.dropdownLabel}>已登录账号</p>
            <p className={styles.dropdownName}>{user.name ?? ""}</p>
            {user.email ? <p className={styles.dropdownEmail}>{user.email}</p> : null}
          </div>
          <button
            type="button"
            className={styles.signOut}
            onClick={() => {
              setOpen(false)
              void signOut({ callbackUrl: "/" })
            }}
          >
            登出
          </button>
        </div>
      ) : null}
    </div>
  )
}
