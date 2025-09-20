import { Pool } from "pg"
import type { Account, Profile, User } from "next-auth"

const globalForDb = globalThis as typeof globalThis & {
  __authDbPool?: Pool | null
}

const debugEnabled =
  (process.env.POSTGRES_DEBUG ?? "").toLowerCase() === "true" ||
  process.env.NODE_ENV === "development"

const debugLog = (...args: unknown[]) => {
  if (debugEnabled) {
    console.log("[postgres]", ...args)
  }
}

const maskConnectionString = (connectionString: string) => {
  try {
    const url = new URL(connectionString)
    if (url.password) {
      url.password = "***"
    }
    return url.toString()
  } catch {
    return connectionString.replace(/(postgres(?:ql)?:\/\/[\w.-]+:)([^@]+)(@)/i, "$1***$3")
  }
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
    debugLog("Reusing cached connection pool")
    pool = globalForDb.__authDbPool
    return pool
  }

  const connectionString = getConnectionString()

  if (!connectionString) {
    debugLog("No PostgreSQL connection string found. Skipping pool creation.")
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

  debugLog(
    "Created new connection pool",
    maskConnectionString(connectionString),
    {
      ssl: shouldUseSSL,
      connectionTimeoutMillis: process.env.POSTGRES_CONNECTION_TIMEOUT ?? 5000,
      idleTimeoutMillis: process.env.POSTGRES_IDLE_TIMEOUT ?? 10000,
    }
  )

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

  debugLog("Ensuring auth_signins table exists")
  await client.query(createTableSQL)
  debugLog("auth_signins table ensured")
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
    debugLog("Recording sign-in", {
      userId: user?.id,
      email: user?.email,
      provider: account?.provider,
      providerAccountId: account?.providerAccountId,
      isNewUser,
    })
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
    debugLog("Sign-in record stored successfully")
  } catch (error) {
    const shouldLog = debugEnabled || !hasLoggedConnectionError
    if (shouldLog) {
      console.error("Failed to record sign-in audit", error)
      if (!debugEnabled) {
        hasLoggedConnectionError = true
      }
    }
  }
}

type JsonLike = Record<string, unknown> | Array<unknown> | string | number | null | undefined

const matchTimeKeys = [
  "match_time",
  "match_datetime",
  "kickoff_at",
  "event_time",
  "start_time",
  "fixture_time",
  "game_time",
  "scheduled_at",
]

const jsonMatchTimeKeys = [
  "match_time",
  "matchTime",
  "kickoff_at",
  "kickoffAt",
  "fixture_time",
  "fixtureTime",
  "start_time",
  "startTime",
  "event_time",
  "eventTime",
  "datetime",
]

const probabilityKeys = [
  "probabilities",
  "win_probabilities",
  "winProbabilities",
  "probability",
  "implied_probabilities",
  "model_probabilities",
]

const averageOddsKeys = [
  "average_odds",
  "avg_odds",
  "odds_average",
  "mean_odds",
  "averageOdds",
  "avgOdds",
  "平均赔率",
]

const institutionOddsKeys = [
  "各机构赛前胜负赔率",
  "bookmaker_odds",
  "bookmakers_odds",
  "pre_match_odds",
  "market_odds",
]

const marketKeys = [
  "market",
  "recommendation_market",
  "bet_market",
  "recommended_market",
]

const pickKeys = [
  "pick",
  "selection",
  "recommended_pick",
  "recommended_selection",
  "outcome",
]

const homeTeamKeys = [
  "home_team",
  "homeTeam",
  "home",
  "home_side",
  "team_home",
]

const awayTeamKeys = [
  "away_team",
  "awayTeam",
  "away",
  "away_side",
  "team_away",
]

const getString = (value: JsonLike): string | null => {
  if (value == null) return null
  if (typeof value === "string") return value
  if (typeof value === "number") return Number.isFinite(value) ? value.toString() : null
  if (Array.isArray(value) && value.length > 0) {
    return getString(value[0] as JsonLike)
  }
  if (typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name
  }
  return null
}

const parseJson = (value: JsonLike): Record<string, unknown> | null => {
  if (value == null) return null
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return null
}

const pickFromObject = (source: Record<string, unknown> | null, keys: string[]): JsonLike => {
  if (!source) return null
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key] as JsonLike
    }
  }
  return null
}

const parseDateValue = (value: JsonLike): Date | null => {
  if (value == null) return null
  if (value instanceof Date) return new Date(value)
  if (typeof value === "number") {
    const numDate = new Date(value)
    return Number.isNaN(numDate.getTime()) ? null : numDate
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    const date = new Date(trimmed)
    if (!Number.isNaN(date.getTime())) return date
    // try parse numeric string
    const asNumber = Number(trimmed)
    if (Number.isFinite(asNumber)) {
      const numericDate = new Date(asNumber)
      if (!Number.isNaN(numericDate.getTime())) return numericDate
    }
  }
  return null
}

const formatAverageOdds = (value: JsonLike): string | null => {
  if (value == null) return null
  if (typeof value === "number") {
    return value.toFixed(2)
  }
  if (typeof value === "string") {
    return value
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "number") return entry.toFixed(2)
        if (typeof entry === "string") return entry
        if (entry && typeof entry === "object" && "label" in entry && "value" in entry) {
          return `${entry.label}: ${entry.value}`
        }
        return null
      })
      .filter(Boolean)
      .join(" / ")
  }
  if (typeof value === "object" && value !== null) {
    const normalized: Record<string, unknown> = value as Record<string, unknown>
    const preferredOrder = ["home", "away", "draw", "over", "under"]
    const parts: string[] = []
    for (const key of preferredOrder) {
      if (key in normalized) {
        const label = key === "home" ? "主胜" : key === "away" ? "客胜" : key === "draw" ? "平局" : key
        const val = normalized[key]
        if (typeof val === "number") {
          parts.push(`${label}: ${val.toFixed(2)}`)
        } else if (typeof val === "string") {
          parts.push(`${label}: ${val}`)
        }
      }
    }
    if (parts.length === 0) {
      for (const [k, v] of Object.entries(normalized)) {
        if (typeof v === "number") {
          parts.push(`${k}: ${v.toFixed(2)}`)
        } else if (typeof v === "string") {
          parts.push(`${k}: ${v}`)
        }
      }
    }
    return parts.join(" / ") || null
  }
  return null
}

const normalizeOutcomeLabel = (label: string) => {
  const lowered = label.toLowerCase()
  if (["home", "1", "home_win", "h"].includes(lowered)) return "主胜"
  if (["away", "2", "away_win", "a"].includes(lowered)) return "客胜"
  if (["draw", "x", "d", "平"].includes(lowered)) return "平局"
  if (["over"].includes(lowered)) return "大球"
  if (["under"].includes(lowered)) return "小球"
  return label
}

const extractOutcomeValue = (value: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (key in value && value[key] != null) {
      const raw = value[key]
      if (typeof raw === "string") return raw
      if (typeof raw === "number") return raw.toFixed(2)
    }
  }
  return null
}

const parseOddsEntries = (value: JsonLike): { label: string; odds: number }[] => {
  if (value == null) return []
  const entries: { label: string; odds: number }[] = []

  const pushEntry = (label: string, oddsValue: unknown) => {
    const numeric = Number(oddsValue)
    if (Number.isFinite(numeric) && numeric > 0) {
      entries.push({ label: normalizeOutcomeLabel(label), odds: numeric })
    }
  }

  if (typeof value === "number") {
    entries.push({ label: "主胜", odds: value })
    return entries
  }

  if (typeof value === "string") {
    const parts = value.split(/[\/、，,]+/)
    for (const part of parts) {
      const match = part.match(/([^:：]+)[:：]\s*([0-9]*\.?[0-9]+)/)
      if (match) {
        pushEntry(match[1].trim(), match[2])
      }
    }
    return entries
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === "object") {
        if ("label" in item && "odds" in item) {
          pushEntry(String(item.label), (item as Record<string, unknown>).odds)
        } else if ("label" in item && "value" in item) {
          pushEntry(String(item.label), (item as Record<string, unknown>).value)
        }
      }
    }
    return entries
  }

  if (typeof value === "object") {
    for (const [label, oddsValue] of Object.entries(value as Record<string, unknown>)) {
      pushEntry(label, oddsValue)
    }
  }

  return entries
}

const deriveProbabilitiesFromOdds = (value: JsonLike): { label: string; value: string }[] => {
  const entries = parseOddsEntries(value)
  if (!entries.length) return []

  const implied = entries
    .map((entry) => ({ label: entry.label, implied: 1 / entry.odds }))
    .filter(({ implied }) => Number.isFinite(implied) && implied > 0)

  const denominator = implied.reduce((sum, entry) => sum + entry.implied, 0)
  if (!denominator) return []

  return implied.map(({ label, implied }) => ({
    label,
    value: `${((implied / denominator) * 100).toFixed(1)}%`,
  }))
}

const extractInstitutionOdds = (
  source: Record<string, unknown> | null,
): {
  name: string
  home: string | null
  draw: string | null
  away: string | null
  offer: string | null
}[] => {
  if (!source) return []
  const raw = pickFromObject(source, institutionOddsKeys)
  const results: {
    name: string
    home: string | null
    draw: string | null
    away: string | null
    offer: string | null
  }[] = []

  const processEntry = (label: string, value: JsonLike) => {
    const normalizedLabel = label.replace(/\(ID:.*?\)/i, "").trim()
    const base: Record<string, unknown> | null = parseJson(value)
    if (!base) return
    const home =
      extractOutcomeValue(base, ["home", "Home", "H", "主胜", "1"]) ??
      getString(base.home as JsonLike)
    const draw =
      extractOutcomeValue(base, ["draw", "Draw", "D", "平局", "X"]) ??
      getString(base.draw as JsonLike)
    const away =
      extractOutcomeValue(base, ["away", "Away", "A", "客胜", "2"]) ??
      getString(base.away as JsonLike)
    if (home || draw || away) {
      results.push({
        name: normalizedLabel || "机构",
        home,
        draw,
        away,
        offer: getString(base.offer as JsonLike) ?? null,
      })
    }
  }

  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (entry && typeof entry === "object" && "name" in entry) {
        processEntry(String(entry.name), entry)
      }
    })
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [name, odds] of Object.entries(raw)) {
      processEntry(name, odds as JsonLike)
    }
  }

  return results.slice(0, 5)
}

const aggregateInstitutionOdds = (
  entries: {
    name: string
    home: string | null
    draw: string | null
    away: string | null
  }[],
): { label: string; value: string }[] => {
  const sums = { home: 0, draw: 0, away: 0 }
  const counts = { home: 0, draw: 0, away: 0 }

  for (const entry of entries) {
    const home = Number(entry.home)
    if (Number.isFinite(home) && home > 0) {
      sums.home += home
      counts.home += 1
    }
    const draw = Number(entry.draw)
    if (Number.isFinite(draw) && draw > 0) {
      sums.draw += draw
      counts.draw += 1
    }
    const away = Number(entry.away)
    if (Number.isFinite(away) && away > 0) {
      sums.away += away
      counts.away += 1
    }
  }

  const results: { label: string; value: string }[] = []
  if (counts.home) results.push({ label: "主胜", value: (sums.home / counts.home).toFixed(2) })
  if (counts.draw) results.push({ label: "平局", value: (sums.draw / counts.draw).toFixed(2) })
  if (counts.away) results.push({ label: "客胜", value: (sums.away / counts.away).toFixed(2) })

  return results
}

const extractProbabilities = (source: Record<string, unknown> | null): { label: string; value: string }[] => {
  if (!source) return []
  const rawProbabilities = pickFromObject(source, probabilityKeys)
  if (!rawProbabilities) return []

  const results: { label: string; value: string }[] = []

  if (Array.isArray(rawProbabilities)) {
    for (const entry of rawProbabilities) {
      if (entry && typeof entry === "object" && "label" in entry && "value" in entry) {
        const entryRecord = entry as Record<string, unknown>
        const label = getString(entryRecord.label as JsonLike)
        const value = getString(entryRecord.value as JsonLike)
        if (label && value) {
          results.push({ label, value })
        }
      }
    }
    return results
  }

  if (typeof rawProbabilities === "object" && rawProbabilities !== null) {
    for (const [label, value] of Object.entries(rawProbabilities)) {
      if (value == null) continue
      if (typeof value === "number") {
        results.push({ label, value: `${(value <= 1 ? value * 100 : value).toFixed(1)}%` })
      } else if (typeof value === "string") {
        results.push({ label, value })
      } else if (typeof value === "object" && value !== null && "value" in value) {
        const innerValue = (value as Record<string, unknown>).value as JsonLike
        const formatted =
          typeof innerValue === "number"
            ? `${(innerValue <= 1 ? innerValue * 100 : innerValue).toFixed(1)}%`
            : getString(innerValue)
        if (formatted) {
          results.push({ label, value: formatted })
        }
      }
    }
  }

  return results
}

const pickTeamName = (source: Record<string, unknown> | null, keys: string[]): string | null => {
  const raw = pickFromObject(source, keys)
  const name = getString(raw)
  if (name) return name
  if (raw && typeof raw === "object") {
    if ("team" in raw && typeof (raw as Record<string, unknown>).team === "string") {
      return (raw as Record<string, unknown>).team as string
    }
    if ("name" in raw && typeof (raw as Record<string, unknown>).name === "string") {
      return (raw as Record<string, unknown>).name as string
    }
  }
  return null
}

const extractMatchTime = (
  row: Record<string, unknown>,
  response: Record<string, unknown> | null,
): Date | null => {
  for (const key of matchTimeKeys) {
    if (key in row) {
      const date = parseDateValue(row[key] as JsonLike)
      if (date) return date
    }
  }
  if (response) {
    const fromResponse = pickFromObject(response, jsonMatchTimeKeys)
    const parsed = parseDateValue(fromResponse)
    if (parsed) return parsed
    if ("fixture" in response && typeof response.fixture === "object" && response.fixture !== null) {
      const nested = parseDateValue(
        pickFromObject(response.fixture as Record<string, unknown>, jsonMatchTimeKeys),
      )
      if (nested) return nested
    }
  }
  if ("created_at" in row) {
    const created = parseDateValue(row.created_at as JsonLike)
    if (created) return created
  }
  return null
}

const normalizeConfidence = (value: JsonLike): number | null => {
  if (value == null) return null
  let numeric: number | null = null
  if (typeof value === "number") {
    numeric = value
  } else if (typeof value === "string") {
    const parsed = Number(value)
    numeric = Number.isFinite(parsed) ? parsed : null
  }
  if (numeric == null || Number.isNaN(numeric)) return null
  if (numeric <= 1 && numeric >= 0) {
    numeric = numeric * 100
  }
  numeric = Math.round(numeric)
  if (numeric > 100) numeric = 100
  if (numeric < 0) numeric = 0
  return numeric
}

const sanitizeComment = (comment: JsonLike, fallback: string | null): string | null => {
  if (comment == null) return fallback
  if (typeof comment === "string") return comment
  if (Array.isArray(comment)) {
    const text = comment.find((entry) => typeof entry === "string")
    return (text as string | undefined) ?? fallback
  }
  return fallback
}

export type AiHighlight = {
  id: string
  title: string
  matchTime: Date | null
  comment: string | null
  market: string | null
  pick: string | null
  averageOdds: string | null
  probabilities: { label: string; value: string }[]
  confidence: number | null
  homeTeam: string | null
  awayTeam: string | null
  institutionOdds: {
    name: string
    home: string | null
    draw: string | null
    away: string | null
    offer: string | null
  }[]
}

const withinNextTwoDays = (date: Date | null): boolean => {
  if (!date) return false
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 2)
  return date >= start && date < end
}

const parseAiHighlight = (row: Record<string, unknown>): AiHighlight | null => {
  const response = parseJson(row.ai_response as JsonLike)

  const homeTeam =
    (response ? pickTeamName(response, homeTeamKeys) : null) ??
    getString(row.home_team as JsonLike) ??
    null

  const awayTeam =
    (response ? pickTeamName(response, awayTeamKeys) : null) ??
    getString(row.away_team as JsonLike) ??
    null

  const matchTime = extractMatchTime(row, response)

  const market =
    getString(row.recommendation_market as JsonLike) ??
    getString(pickFromObject(response, marketKeys)) ??
    "推荐盘口"

  const pick =
    getString(row.recommendation_pick as JsonLike) ??
    getString(pickFromObject(response, pickKeys)) ??
    null

  const averageOdds =
    formatAverageOdds(row.average_odds as JsonLike) ??
    formatAverageOdds(pickFromObject(response, averageOddsKeys))

  const institutionOdds = extractInstitutionOdds(response)

  let probabilities = aggregateInstitutionOdds(institutionOdds)
  if (!probabilities.length) {
    probabilities = extractProbabilities(response)
  }
  if (!probabilities.length) {
    probabilities = deriveProbabilitiesFromOdds(row.average_odds as JsonLike)
  }
  if (!probabilities.length && response) {
    probabilities = deriveProbabilitiesFromOdds(pickFromObject(response, averageOddsKeys))
  }

  const confidence = normalizeConfidence(row.recommendation_index as JsonLike)

  const comment = sanitizeComment(row.recommendation_comment as JsonLike, getString(response?.comment as JsonLike))

  const title = homeTeam && awayTeam ? `${homeTeam} vs. ${awayTeam}` : "AI 推荐赛事"

  return {
    id: String(row.id ?? `${homeTeam ?? "home"}-${awayTeam ?? "away"}-${matchTime?.getTime() ?? Date.now()}`),
    title,
    matchTime,
    comment,
    market,
    pick,
    averageOdds,
    probabilities,
    confidence,
    homeTeam,
    awayTeam,
    institutionOdds,
  }
}

export async function fetchTopAiRecommendations(limit = 3): Promise<AiHighlight[]> {
  const db = getPool()
  if (!db) {
    debugLog("Skipping fetchTopAiRecommendations: no database connection available")
    return []
  }

  try {
    const fetchLimit = Math.max(limit * 4, limit)
    const { rows } = await db.query(`
      SELECT *
      FROM ai_eval
      ORDER BY recommendation_index DESC NULLS LAST
      LIMIT $1
    `, [fetchLimit])

    const parsed = rows
      .map((row) => parseAiHighlight(row))
      .filter((item): item is AiHighlight => item !== null)

    const filtered = parsed.filter((item) => withinNextTwoDays(item.matchTime))
    const result = (filtered.length >= limit ? filtered : parsed).slice(0, limit)

    debugLog("Fetched AI recommendations", result.map((item) => ({ id: item.id, matchTime: item.matchTime, confidence: item.confidence })))

    return result
  } catch (error) {
    console.error("Failed to fetch AI recommendations", error)
    return []
  }
}
