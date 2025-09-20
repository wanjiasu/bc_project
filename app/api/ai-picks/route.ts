import { NextRequest, NextResponse } from "next/server"

import { fetchTopAiRecommendations } from "src/lib/postgres"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.min(Number(limitParam) || 0, 50) : 20

    const picksRaw = await fetchTopAiRecommendations(limit || 20)

    const picks = picksRaw.map((item) => ({
      ...item,
      matchTime: item.matchTime ? item.matchTime.toISOString() : null,
      fixtureId:
        item.fixtureId ??
        (typeof item.id === "string" ? item.id : item.id != null ? String(item.id) : null),
    }))

    return NextResponse.json({ picks }, { status: 200 })
  } catch (error) {
    console.error("Error fetching AI picks:", error)
    return NextResponse.json(
      { error: "Failed to fetch AI picks" },
      { status: 500 },
    )
  }
}
