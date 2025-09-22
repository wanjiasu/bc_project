import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

import { recordSignInEvent, getUserByProviderAccount } from "./src/lib/postgres"

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
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // 在首次登录时，获取用户的UUID并存储在token中
      if (account && user) {
        const userRecord = await getUserByProviderAccount(account.provider, account.providerAccountId)
        if (userRecord) {
          token.userId = userRecord.id
          token.email = userRecord.email
        }
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // 将用户UUID添加到session中
      if (token.userId) {
        session.user.id = token.userId as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      return true
    },
  },
  // 确保在生产环境中使用正确的 URL
  trustHost: process.env.NODE_ENV === "production",
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await recordSignInEvent({ user, account, profile, isNewUser })
    },
  },
})
