"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, testConnection, isSupabaseConfigured, hashPassword, verifyPassword } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, User, Lock, ArrowRight } from "lucide-react"

type AuthStep = "username" | "password" | "create-password"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [authStep, setAuthStep] = useState<AuthStep>("username")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")
  const [existingUser, setExistingUser] = useState<any>(null)
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

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || connectionStatus !== "connected") return

    setLoading(true)
    setError("")

    try {
      // Check if user exists
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username.trim())
        .maybeSingle()

      if (fetchError) {
        console.error("Error checking user:", fetchError)
        throw new Error("Database error occurred")
      }

      if (user) {
        setExistingUser(user)
        if (user.password_hash) {
          // User has password, ask for it
          setAuthStep("password")
        } else {
          // Existing user without password, ask to create one
          setAuthStep("create-password")
        }
      } else {
        // New user, ask to create password
        setAuthStep("create-password")
      }
    } catch (err: any) {
      console.error("Username check error:", err)
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError("")

    try {
      if (!existingUser?.password_hash) {
        throw new Error("User password not found")
      }

      const isValid = await verifyPassword(password, existingUser.password_hash)
      if (!isValid) {
        throw new Error("Invalid password")
      }

      // Password is correct, log in
      localStorage.setItem("currentUser", JSON.stringify(existingUser))
      console.log("User logged in:", existingUser)
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Password verification error:", err)
      setError(err.message || "Invalid password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || password !== confirmPassword) return

    setLoading(true)
    setError("")

    try {
      const hashedPassword = await hashPassword(password)

      if (existingUser) {
        // Update existing user with password
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({ password_hash: hashedPassword })
          .eq("id", existingUser.id)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating user password:", updateError)
          throw new Error("Failed to set password")
        }

        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        console.log("Password set for existing user:", updatedUser)
      } else {
        // Create new user with password
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([{ username: username.trim(), password_hash: hashedPassword }])
          .select()
          .single()

        if (createError) {
          console.error("Error creating user:", createError)
          throw new Error("Failed to create user account")
        }

        localStorage.setItem("currentUser", JSON.stringify(newUser))
        console.log("New user created:", newUser)
      }

      router.push("/dashboard")
    } catch (err: any) {
      console.error("Create password error:", err)
      setError(err.message || "Failed to set password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setAuthStep("username")
    setPassword("")
    setConfirmPassword("")
    setError("")
    setExistingUser(null)
  }

  const getStepTitle = () => {
    switch (authStep) {
      case "username":
        return "Enter Username"
      case "password":
        return `Welcome back, ${username}!`
      case "create-password":
        return existingUser ? `Set Password for ${username}` : `Create Account for ${username}`
    }
  }

  const getStepDescription = () => {
    switch (authStep) {
      case "username":
        return "Enter your username to continue"
      case "password":
        return "Enter your password to sign in"
      case "create-password":
        return existingUser ? "Set a password for future logins" : "Create a password for your new account"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Carbon Black OAN Tool</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>

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
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  authStep === "username" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  authStep === "username"
                    ? "bg-gray-200 text-gray-400"
                    : authStep === "password"
                      ? "bg-blue-500 text-white"
                      : "bg-green-500 text-white"
                }`}
              >
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-center mb-4">{getStepTitle()}</h3>

          {/* Username Step */}
          {authStep === "username" && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !username.trim() || connectionStatus !== "connected"}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          )}

          {/* Password Step */}
          {authStep === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="transition-all duration-200"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 bg-transparent"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !password.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Create Password Step */}
          {authStep === "create-password" && (
            <form onSubmit={handleCreatePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  disabled={loading}
                  className="transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                  className="transition-all duration-200"
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !password.trim() || password !== confirmPassword}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {existingUser ? "Setting..." : "Creating..."}
                    </>
                  ) : existingUser ? (
                    "Set Password"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
