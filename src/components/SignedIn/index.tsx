"use client"

import { useEffect, useRef, useState } from "react"

import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Lottie from "lottie-react"
import { BsFillCheckCircleFill } from "react-icons/bs"

import confetti from "public/lotties/confetti.json"

import styles from "./index.module.scss"

export const SignedIn = () => {
  const { data: session } = useSession()
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const hasRedirected = useRef(false)
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || hasRedirected.current) return

    redirectTimeout.current = setTimeout(() => {
      if (!hasRedirected.current) {
        hasRedirected.current = true
        router.replace("/")
      }
    }, 3200)

    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current)
        redirectTimeout.current = null
      }
    }
  }, [isClient, router])

  const handleAnimationComplete = () => {
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current)
      redirectTimeout.current = null
    }
    if (!hasRedirected.current) {
      hasRedirected.current = true
      router.replace("/")
    }
  }

  return (
    <div className={styles.signedin_container}>
      <div className={styles.signedin_content}>
        <BsFillCheckCircleFill />
        <p>
          You&apos;re signed in
          <br />
          as {session?.user?.name}
        </p>
      </div>
      <button onClick={() => signOut()} className={styles.btn_signout}>
        Sign out
      </button>
      <div className={styles.lottie_container} suppressHydrationWarning>
        {isClient ? (
          <Lottie
            animationData={confetti}
            loop={false}
            onComplete={handleAnimationComplete}
          />
        ) : null}
      </div>
    </div>
  )
}
