import { supabase } from "@/lib/supabase"
import type { Database, ZillowIntegrationStatus } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating profile:", error)
    return null
  }

  return data
}

export async function createProfile(
  profile: Database["public"]["Tables"]["profiles"]["Insert"],
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating profile:", error)
    return null
  }

  return data
}

export async function updateZillowPremierEmail(userId: string, zillowPremierEmail: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      zillow_premier_email: zillowPremierEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating Zillow Premier email:", error)
    return null
  }

  return data
}

export async function updateZillowIntegrationStatus(
  userId: string,
  status: ZillowIntegrationStatus,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      zillow_integration_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating Zillow integration status:", error)
    return null
  }

  return data
}
