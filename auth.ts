import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

import { recordSignInEvent } from "./src/lib/postgres"

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  process.env.NEXT_AUTH_SECRET

if (!authSecret) {
  throw new Error("Missing Auth secret. Set AUTH_SECRET in your environment.")
}

export const { auth, handlers } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
  ],
  secret: authSecret,
  // 信任主机头，允许动态URL
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 如果是相对URL，使用baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // 如果URL的主机与baseUrl相同，允许重定向
      else if (new URL(url).origin === baseUrl) return url
      // 否则重定向到baseUrl
      return baseUrl
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await recordSignInEvent({ user, account, profile, isNewUser })
    },
  },
})
