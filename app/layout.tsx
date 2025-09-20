import type { Metadata } from "next"
import { auth } from "auth"
import { SessionProvider } from "next-auth/react"
import "styles/globals.scss"

export const metadata: Metadata = {
  title: "next-social-login",
  description:
    "An easy authentication way to Github, Google or Facebook using NextAuth.js.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}
