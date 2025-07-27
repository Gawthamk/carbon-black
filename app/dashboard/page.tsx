"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, type User, type OanEntry, isSupabaseConfigured } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { GradeProvider, useGrade } from "@/contexts/GradeContext"
import GradeSelector from "@/components/GradeSelector"
import DataEntryForm from "@/components/DataEntryForm"
import HistoryTable from "@/components/HistoryTable"
import AnalysisChart from "@/components/AnalysisChart"
import CalculationPanel from "@/components/CalculationPanel"

function DashboardContent() {
  const { selectedGrade } = useGrade()
  const [user, setUser] = useState<User | null>(null)
  const [allEntries, setAllEntries] = useState<OanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calculations, setCalculations] = useState({
    meanOan: null as number | null,
    meanK2co3: null as number | null,
    meanOil: null as number | null,
    meanInverseK2co3: null as number | null,
    coeffB1: null as number | null,
    coeffB2: null as number | null,
    interceptB0: null as number | null,
    predictedOan: null as number | null,
    k2co3Optimal: null as number | null,
    oilFlowOptimal: null as number | null,
    standardDeviation: null as number | null,
    cpu: null as number | null,
    cpl: null as number | null,
    cpk: null as number | null,
    entryCount: 0,
  })
  const router = useRouter()

  // Filter entries by selected grade
  const filteredEntries = allEntries.filter((entry) => entry.grade === selectedGrade)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("currentUser")
    if (!userData) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log("Parsed user from localStorage:", parsedUser)

      // Verify user exists in database
      verifyAndSetUser(parsedUser)
    } catch (err) {
      console.error("Error parsing user data:", err)
      localStorage.removeItem("currentUser")
      router.push("/login")
    }
  }, [router])

  // Recalculate when selected grade changes
  useEffect(() => {
    if (user && allEntries.length > 0) {
      const gradeFilteredEntries = allEntries.filter((entry) => entry.grade === selectedGrade)
      calculateAllValues(gradeFilteredEntries, user.id)
    } else {
      // Reset calculations when no entries or no user
      setCalculations({
        meanOan: null,
        meanK2co3: null,
        meanOil: null,
        meanInverseK2co3: null,
        coeffB1: null,
        coeffB2: null,
        interceptB0: null,
        predictedOan: null,
        k2co3Optimal: null,
        oilFlowOptimal: null,
        standardDeviation: null,
        cpu: null,
        cpl: null,
        cpk: null,
        entryCount: 0,
      })
    }
  }, [selectedGrade, allEntries, user])

  const verifyAndSetUser = async (userData: User) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setError("Database not configured. Please set up Supabase environment variables.")
        setLoading(false)
        return
      }

      // Verify user exists in database using maybeSingle to handle multiple/no rows
      const { data: dbUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .maybeSingle()

      if (userError) {
        console.error("Error verifying user:", userError)
        setError(`Database error: ${userError.message}`)
        setLoading(false)
        return
      }

      if (!dbUser) {
        console.log("User not found in database, redirecting to login")
        localStorage.removeItem("currentUser")
        router.push("/login")
        return
      }

      console.log("User verified in database:", dbUser)
      setUser(dbUser)
      await fetchAllEntries(dbUser.id)
    } catch (err: any) {
      console.error("Error verifying user:", err)
      setError(`Verification failed: ${err.message}`)
      setLoading(false)
    }
  }

  const fetchAllEntries = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching all entries for user ID:", userId)

      const { data, error: fetchError } = await supabase
        .from("oan_entries")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: true })

      if (fetchError) {
        console.error("Error fetching entries:", fetchError)
        throw new Error("Failed to fetch entries from database")
      }

      console.log("Fetched entries:", data?.length || 0, "entries")
      setAllEntries(data || [])

      // Calculate values for the currently selected grade
      const gradeEntries = (data || []).filter((entry) => entry.grade === selectedGrade)
      if (gradeEntries.length > 0) {
        await calculateAllValues(gradeEntries, userId)
      } else {
        setCalculations((prev) => ({ ...prev, entryCount: 0 }))
      }
    } catch (err: any) {
      console.error("Error in fetchAllEntries:", err)
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const calculateAllValues = async (entriesData: OanEntry[], userId: string) => {
    try {
      // Reset calculations immediately if no data for selected grade
      if (entriesData.length < 1) {
        setCalculations({
          meanOan: null,
          meanK2co3: null,
          meanOil: null,
          meanInverseK2co3: null,
          coeffB1: null,
          coeffB2: null,
          interceptB0: null,
          predictedOan: null,
          k2co3Optimal: null,
          oilFlowOptimal: null,
          standardDeviation: null,
          cpu: null,
          cpl: null,
          cpk: null,
          entryCount: 0,
        })
        return
      }

      // Get or create running sums for the specific grade
      const runningKey = `${userId}_${selectedGrade}`
      let { data: runningSums, error } = await supabase
        .from("running_sums")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching running sums:", error)
        throw error
      }

      if (!runningSums) {
        // Create new running sums record
        console.log("Creating running sums for user:", userId)
        const { data: newSums, error: createError } = await supabase
          .from("running_sums")
          .insert([{ user_id: userId }])
          .select()
          .single()

        if (createError) {
          console.error("Error creating running sums:", createError)
          throw createError
        }
        runningSums = newSums
      }

      const n = entriesData.length

      // Calculate running sums for the selected grade only
      let s0 = 0,
        sk = 0,
        sik = 0,
        soil = 0,
        so_ik = 0,
        so_oil = 0,
        sik_squared = 0,
        soil_squared = 0

      entriesData.forEach((entry) => {
        const invK2co3 = 1 / entry.k2co3_flow
        s0 += entry.oan
        sk += entry.k2co3_flow
        sik += invK2co3
        soil += entry.oil_flow
        so_ik += entry.oan * invK2co3
        so_oil += entry.oan * entry.oil_flow
        sik_squared += invK2co3 * invK2co3
        soil_squared += entry.oil_flow * entry.oil_flow
      })

      // Calculate means
      const meanOan = s0 / n
      const meanK2co3 = sk / n
      const meanOil = soil / n
      const meanInverseK2co3 = sik / n

      let coeffB1 = null,
        coeffB2 = null,
        interceptB0 = null,
        predictedOan = null
      let k2co3Optimal = null,
        standardDeviation = null,
        cpu = null,
        cpl = null,
        cpk = null
      let oilFlowOptimal = null // Declare oilFlowOptimal variable

      if (n >= 2) {
        // Calculate coefficients using the corrected formulas
        const latestEntry = entriesData[entriesData.length - 1]

        // B1 coefficient calculation
        let numeratorB1 = 0,
          denominatorB1 = 0
        entriesData.forEach((entry) => {
          const invK2co3Diff = 1 / entry.k2co3_flow - meanInverseK2co3
          const oanDiff = entry.oan - meanOan
          numeratorB1 += invK2co3Diff * oanDiff
          denominatorB1 += invK2co3Diff * invK2co3Diff
        })
        coeffB1 = denominatorB1 !== 0 ? numeratorB1 / denominatorB1 : 0

        // B2 coefficient calculation
        let numeratorB2 = 0,
          denominatorB2 = 0
        entriesData.forEach((entry) => {
          const oilDiff = entry.oil_flow - meanOil
          const oanDiff = entry.oan - meanOan
          numeratorB2 += oilDiff * oanDiff
          denominatorB2 += oilDiff * oilDiff
        })
        coeffB2 = denominatorB2 !== 0 ? numeratorB2 / denominatorB2 : 0

        // B0 intercept calculation
        interceptB0 = latestEntry.target_oan - coeffB1 * meanInverseK2co3 - coeffB2 * meanOil

        // Predicted OAN calculation
        predictedOan = interceptB0 + coeffB1 * (1 / latestEntry.k2co3_flow) + coeffB2 * latestEntry.oil_flow

        // Optimal K2CO3 calculation
        if (coeffB1 !== 0) {
          const denominator = latestEntry.target_oan - interceptB0 - coeffB2 * latestEntry.oil_flow
          if (denominator !== 0) {
            k2co3Optimal = coeffB1 / denominator
          }
        }

        // Optimal Oil Flow calculation
        if (coeffB2 !== 0) {
          oilFlowOptimal = (latestEntry.target_oan - interceptB0 - coeffB1 * meanInverseK2co3) / coeffB2
        }

        // Statistical calculations
        const sumSquaredDeviations = entriesData.reduce((sum, entry) => {
          return sum + Math.pow(entry.oan - meanOan, 2)
        }, 0)
        standardDeviation = Math.sqrt(sumSquaredDeviations / (n - 1))

        if (standardDeviation > 0) {
          cpu = (latestEntry.usl - meanOan) / (3 * standardDeviation)
          cpl = (meanOan - latestEntry.lsl) / (3 * standardDeviation)
          cpk = Math.min(cpu, cpl)
        }
      }

      setCalculations({
        meanOan,
        meanK2co3,
        meanOil,
        meanInverseK2co3,
        coeffB1,
        coeffB2,
        interceptB0,
        predictedOan,
        k2co3Optimal,
        oilFlowOptimal,
        standardDeviation,
        cpu,
        cpl,
        cpk,
        entryCount: n,
      })

      console.log("Calculations updated for", n, "entries for grade", selectedGrade)
    } catch (err) {
      console.error("Error in calculateAllValues:", err)
      setError("Failed to calculate values")
    }
  }

  const addEntry = async (entryData: Omit<OanEntry, "id" | "user_id" | "created_at" | "predicted_oan">) => {
    if (!user) {
      console.error("No user found when trying to add entry")
      return { success: false, error: "User not found" }
    }

    try {
      console.log("Adding entry for user:", user.id, "grade:", selectedGrade)

      // Calculate predicted OAN before inserting (for next entry)
      let predictedOan = null
      if (
        filteredEntries.length >= 1 &&
        calculations.coeffB1 !== null &&
        calculations.coeffB2 !== null &&
        calculations.interceptB0 !== null
      ) {
        predictedOan =
          calculations.interceptB0 +
          calculations.coeffB1 * (1 / entryData.k2co3_flow) +
          calculations.coeffB2 * entryData.oil_flow
        console.log("Calculated predicted OAN:", predictedOan)
      }

      const insertData = {
        ...entryData,
        user_id: user.id,
        predicted_oan: predictedOan,
      }

      const { data, error: insertError } = await supabase.from("oan_entries").insert([insertData]).select().single()

      if (insertError) {
        console.error("Error inserting entry:", insertError)
        throw new Error(`Database error: ${insertError.message}`)
      }

      console.log("Entry inserted successfully")

      const newAllEntries = [...allEntries, data]
      setAllEntries(newAllEntries)

      // Recalculate values for the current grade
      const newFilteredEntries = newAllEntries.filter((entry) => entry.grade === selectedGrade)
      await calculateAllValues(newFilteredEntries, user.id)

      return { success: true }
    } catch (err: any) {
      console.error("Error adding entry:", err)
      return { success: false, error: err.message || "Failed to add entry" }
    }
  }

  const deleteEntry = async (entryId: string) => {
    try {
      console.log("Deleting entry:", entryId)

      const { error: deleteError } = await supabase.from("oan_entries").delete().eq("id", entryId)

      if (deleteError) {
        console.error("Error deleting entry:", deleteError)
        throw new Error("Failed to delete entry from database")
      }

      const newAllEntries = allEntries.filter((entry) => entry.id !== entryId)
      setAllEntries(newAllEntries)

      // Recalculate values for the current grade
      if (user) {
        const newFilteredEntries = newAllEntries.filter((entry) => entry.grade === selectedGrade)
        await calculateAllValues(newFilteredEntries, user.id)
      }

      console.log("Entry deleted successfully")
      return { success: true }
    } catch (err: any) {
      console.error("Error deleting entry:", err)
      return { success: false, error: err.message || "Failed to delete entry" }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("selectedGrade") // Clear grade selection on logout
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <header className="flex justify-between items-center mb-6 animate-slideDown">
          <div className="text-center flex-1">
            <div className="flex justify-center mb-4">
              <img
                src="/PCBL.NS_BIG.png"
                alt="Carbon Black OAN Tool Logo"
                style={{ width: "120px", marginBottom: "12px" }}
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Carbon Black OAN Prediction Tool
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome, <span className="font-semibold text-blue-600">{user.username}</span>. Sequential calculation
              system with automatic mean updates.
            </p>
            <p className="text-sm text-gray-500 mt-1">Made by Gawtham K</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="transition-all duration-200 hover:scale-105 bg-transparent"
          >
            Logout
          </Button>
        </header>

        {/* Grade Selector */}
        <GradeSelector />

        <Tabs defaultValue="entry" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger
              value="entry"
              className="transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Data & Prediction
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Entry History
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Analysis Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DataEntryForm onAddEntry={addEntry} onCalculationsUpdate={setCalculations} />
              <CalculationPanel calculations={calculations} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="animate-fadeIn">
            <HistoryTable entries={filteredEntries} onDeleteEntry={deleteEntry} />
          </TabsContent>

          <TabsContent value="analysis" className="animate-fadeIn">
            <AnalysisChart entries={filteredEntries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <GradeProvider>
      <DashboardContent />
    </GradeProvider>
  )
}
