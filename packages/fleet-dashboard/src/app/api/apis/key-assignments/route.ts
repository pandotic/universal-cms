import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-central/auth-middleware"
import { supabaseRequest, isSupabaseConfigured } from "@/lib/api-central/supabase"

export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const secretId = searchParams.get("secret_id")
  const propertyId = searchParams.get("property_id")

  let query = "hub_api_key_assignments?select=*&order=assigned_at.desc"
  if (secretId) query += `&secret_id=eq.${secretId}`
  if (propertyId) query += `&property_id=eq.${propertyId}`

  try {
    const assignments = await supabaseRequest(query)
    return NextResponse.json({ assignments: assignments || [] })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch assignments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { secret_id, property_id, environment, notes } = body

    if (!secret_id || !property_id) {
      return NextResponse.json(
        { error: "secret_id and property_id are required" },
        { status: 400 }
      )
    }

    const assignment = await supabaseRequest("hub_api_key_assignments", {
      method: "POST",
      body: JSON.stringify({
        secret_id,
        property_id,
        environment: environment || "production",
        notes: notes || null,
      }),
      headers: { Prefer: "return=representation" },
    })

    return NextResponse.json({ assignment: assignment?.[0] || assignment })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create assignment" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    await supabaseRequest(`hub_api_key_assignments?id=eq.${id}`, {
      method: "DELETE",
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete assignment" },
      { status: 500 }
    )
  }
}
