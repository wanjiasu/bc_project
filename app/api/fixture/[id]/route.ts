import { NextResponse } from "next/server"

import { fetchFixtureById } from "src/lib/postgres"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const fixture = await fetchFixtureById(id)

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    const fixtureJson = {
      ...fixture,
      matchTime: fixture.matchTime ? fixture.matchTime.toISOString() : null,
      probabilities: fixture.probabilities ?? [],
      institutionOdds: fixture.institutionOdds ?? [],
    }

    return NextResponse.json({ fixture: fixtureJson }, { status: 200 })
  } catch (error) {
    console.error("Error fetching fixture data:", error)
    return NextResponse.json({ error: "Failed to fetch fixture data" }, { status: 500 })
  }
}
