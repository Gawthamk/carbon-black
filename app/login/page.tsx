"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, testConnection, isSupabaseConfigured } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")
  const router = useRouter()

  useEffect(() => {
    // Clear any existing user data on login page
    localStorage.removeItem("currentUser")

    // Check if Supabase is configured before testing connection
    const checkConnection = async () => {
      if (!isSupabaseConfigured()) {
        setConnectionStatus("error")
        setError("Supabase is not configured. Please set up your environment variables.")
        return
      }

      const result = await testConnection()
      setConnectionStatus(result.success ? "connected" : "error")
      if (!result.success) {
        setError(result.error || "Unable to connect to database. Please check your configuration.")
      }
    }

    checkConnection()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || connectionStatus !== "connected") return

    setLoading(true)
    setError("")

    try {
      // First, check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username.trim())
        .maybeSingle()

      if (fetchError) {
        console.error("Error checking user:", fetchError)
        throw new Error("Database error occurred")
      }

      let currentUser = existingUser

      if (!existingUser) {
        // User doesn't exist, create new user
        console.log("Creating new user:", username.trim())
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([{ username: username.trim() }])
          .select()
          .single()

        if (createError) {
          console.error("Error creating user:", createError)
          throw new Error("Failed to create user account")
        }

        console.log("New user created:", newUser)
        currentUser = newUser
      }

      if (!currentUser) {
        throw new Error("Failed to get user information")
      }

      // Store user info in localStorage for session management
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
      console.log("User logged in:", currentUser)

      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An error occurred during login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/PCBL.NS_BIG.png" alt="Carbon Black OAN Tool Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Carbon Black OAN Tool</CardTitle>
          <CardDescription>Enter your username to access the prediction tool</CardDescription>
          <p className="text-sm text-gray-500 mt-2">Made by Gawtham K</p>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {connectionStatus === "checking" && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">Connecting to database...</span>
              </>
            )}
            {connectionStatus === "connected" && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Database connected</span>
              </>
            )}
            {connectionStatus === "error" && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Connection failed</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading || connectionStatus !== "connected"}
                className="transition-all duration-200"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !username.trim() || connectionStatus !== "connected"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
