import { Pool } from "pg"
import type { Account, Profile, User } from "next-auth"

const globalForDb = globalThis as typeof globalThis & {
  __authDbPool?: Pool | null
}

let pool: Pool | null = null
let tableEnsured = false
let hasLoggedConnectionError = false

function getConnectionString(): string | null {
  const connectionUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (connectionUrl) return connectionUrl

  if (process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD && process.env.POSTGRES_HOST) {
    const port = process.env.POSTGRES_PORT ?? "5432"
    const dbName = process.env.POSTGRES_DB ?? "postgres"
    return `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${port}/${dbName}`
  }

  return null
}

function getPool(): Pool | null {
  if (pool) return pool
  if (globalForDb.__authDbPool) {
    pool = globalForDb.__authDbPool
    return pool
  }

  const connectionString = getConnectionString()

  if (!connectionString) {
    return null
  }

  const shouldUseSSL = (process.env.POSTGRES_SSL ?? "false").toLowerCase() === "true"

  pool = new Pool({
    connectionString,
    ssl: shouldUseSSL
      ? {
          rejectUnauthorized: (process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED ?? "false").toLowerCase() === "true",
        }
      : undefined,
    statement_timeout: process.env.POSTGRES_STATEMENT_TIMEOUT
      ? Number(process.env.POSTGRES_STATEMENT_TIMEOUT)
      : undefined,
    connectionTimeoutMillis: process.env.POSTGRES_CONNECTION_TIMEOUT
      ? Number(process.env.POSTGRES_CONNECTION_TIMEOUT)
      : 5000,
    idleTimeoutMillis: process.env.POSTGRES_IDLE_TIMEOUT
      ? Number(process.env.POSTGRES_IDLE_TIMEOUT)
      : 10_000,
    keepAlive: true,
  })

  globalForDb.__authDbPool = pool

  return pool
}

async function ensureTableExists(client: Pool) {
  if (tableEnsured) return

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS auth_signins (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      provider TEXT NOT NULL,
      provider_account_id TEXT,
      email TEXT,
      name TEXT,
      image TEXT,
      profile JSONB,
      is_new_user BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await client.query(createTableSQL)
  tableEnsured = true
}

export type SignInAuditPayload = {
  user: User
  account?: Account | null
  profile?: Profile
  isNewUser?: boolean
}

export async function recordSignInEvent({
  user,
  account,
  profile,
  isNewUser,
}: SignInAuditPayload) {
  const db = getPool()
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      console.warn("PostgreSQL connection not configured. Skipping sign-in audit logging.")
    }
    return
  }

  try {
    await ensureTableExists(db)

    const query = `
      INSERT INTO auth_signins (
        user_id,
        provider,
        provider_account_id,
        email,
        name,
        image,
        profile,
        is_new_user
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `

    await db.query(query, [
      user?.id ?? null,
      account?.provider ?? null,
      account?.providerAccountId ?? null,
      user?.email ?? null,
      user?.name ?? null,
      user?.image ?? null,
      profile ? JSON.stringify(profile) : null,
      isNewUser ?? null,
    ])

    hasLoggedConnectionError = false
  } catch (error) {
    if (!hasLoggedConnectionError) {
      console.error("Failed to record sign-in audit", error)
      hasLoggedConnectionError = true
    }
  }
}
