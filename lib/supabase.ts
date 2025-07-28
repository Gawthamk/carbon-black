import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a safe client that won't throw during build
let supabase: any = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  } else {
    // Create a mock client for build time
    supabase = {
      from: () => ({
        select: () => ({ data: null, error: new Error("Supabase not configured") }),
        insert: () => ({ data: null, error: new Error("Supabase not configured") }),
        update: () => ({ data: null, error: new Error("Supabase not configured") }),
        delete: () => ({ data: null, error: new Error("Supabase not configured") }),
        eq: () => ({ data: null, error: new Error("Supabase not configured") }),
        maybeSingle: () => ({ data: null, error: new Error("Supabase not configured") }),
        single: () => ({ data: null, error: new Error("Supabase not configured") }),
        order: () => ({ data: null, error: new Error("Supabase not configured") }),
        limit: () => ({ data: null, error: new Error("Supabase not configured") }),
      }),
    }
  }
} catch (error) {
  console.error("Error creating Supabase client:", error)
  // Create mock client as fallback
  supabase = {
    from: () => ({
      select: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      insert: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      update: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      delete: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      eq: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      maybeSingle: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      single: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      order: () => ({ data: null, error: new Error("Supabase client creation failed") }),
      limit: () => ({ data: null, error: new Error("Supabase client creation failed") }),
    }),
  }
}

export { supabase }

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export type User = {
  id: string
  username: string
  password_hash?: string | null
  created_at: string
  updated_at?: string
}

export type OanEntry = {
  id: string
  user_id: string
  grade: string
  oan: number
  lsl: number
  usl: number
  target_oan: number
  k2co3_flow: number
  oil_flow: number
  predicted_oan?: number | null
  timestamp: string
  created_at: string
}

export type RunningSums = {
  id: string
  user_id: string
  n: number
  s0: number // sum of OAN
  sk: number // sum of K2CO3 flow
  sik: number // sum of inverse K2CO3
  soil: number // sum of oil flow
  so_ik: number // sum of OAN * inverse K2CO3
  so_oil: number // sum of OAN * oil flow
  sik_squared: number // sum of (inverse K2CO3)^2
  soil_squared: number // sum of oil flow^2
  updated_at: string
}

export const GRADE_PRESETS = {
  N660: { lsl: 87, target: 90, usl: 93 },
  N550: { lsl: 118, target: 121, usl: 124 },
  N772: { lsl: 62, target: 65, usl: 68 },
  N774: { lsl: 69, target: 72, usl: 75 },
  N762: { lsl: 62, target: 65, usl: 68 },
} as const

// Password hashing utilities (simple implementation - in production use bcrypt)
export const hashPassword = async (password: string): Promise<string> => {
  // Simple hash implementation - in production, use bcrypt or similar
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "carbon_black_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

// CSV Export/Import utilities
export const exportToCSV = (entries: OanEntry[], filename?: string): void => {
  const headers = [
    "Grade",
    "OAN",
    "LSL",
    "USL",
    "Target OAN",
    "K2CO3 Flow",
    "Oil Flow",
    "Predicted OAN",
    "Timestamp",
    "Created At",
  ]

  const csvContent = [
    headers.join(","),
    ...entries.map((entry) =>
      [
        entry.grade,
        entry.oan,
        entry.lsl,
        entry.usl,
        entry.target_oan,
        entry.k2co3_flow,
        entry.oil_flow,
        entry.predicted_oan || "",
        entry.timestamp,
        entry.created_at,
      ].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename || `oan_entries_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const parseCSV = (csvText: string): Partial<OanEntry>[] => {
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const entry: any = {}

      headers.forEach((header, index) => {
        const value = values[index]
        switch (header.toLowerCase()) {
          case "grade":
            entry.grade = value
            break
          case "oan":
            entry.oan = Number.parseFloat(value)
            break
          case "lsl":
            entry.lsl = Number.parseFloat(value)
            break
          case "usl":
            entry.usl = Number.parseFloat(value)
            break
          case "target oan":
            entry.target_oan = Number.parseFloat(value)
            break
          case "k2co3 flow":
            entry.k2co3_flow = Number.parseFloat(value)
            break
          case "oil flow":
            entry.oil_flow = Number.parseFloat(value)
            break
          case "predicted oan":
            entry.predicted_oan = value ? Number.parseFloat(value) : null
            break
          case "timestamp":
            entry.timestamp = value
            break
        }
      })

      return entry
    })
    .filter((entry) => entry.grade && !isNaN(entry.oan))
}

// Test Supabase connection with better error handling
export const testConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          "Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      }
    }

    console.log("Testing Supabase connection...")
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      console.error("Connection test failed:", error)
      return { success: false, error: `Database connection failed: ${error.message}` }
    }

    console.log("Supabase connection successful")
    return { success: true }
  } catch (error: any) {
    console.error("Supabase connection test failed:", error)
    return { success: false, error: `Connection test error: ${error.message}` }
  }
}

// Helper function to validate user ID format
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
