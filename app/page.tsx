"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isSupabaseConfigured } from "@/lib/supabase"
import EnvironmentSetup from "@/components/EnvironmentSetup"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setNeedsSetup(true)
      setLoading(false)
      return
    }

    // Check if user is already logged in
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner message="Initializing..." />
      </div>
    )
  }

  if (needsSetup) {
    return <EnvironmentSetup />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <LoadingSpinner message="Redirecting..." />
    </div>
  )
}
