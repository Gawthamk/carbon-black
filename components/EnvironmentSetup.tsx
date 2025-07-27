"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, Copy } from "lucide-react"
import { useState } from "react"

export default function EnvironmentSetup() {
  const [copied, setCopied] = useState(false)

  const envTemplate = `# Add these to your .env.local file or Vercel environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Supabase environment variables are not configured. Please set up your database connection to use this
              application.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Setup Steps:</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Create a Supabase Project</p>
                  <p className="text-sm text-gray-600">
                    Go to{" "}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      supabase.com <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    and create a new project
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Get Your Project Credentials</p>
                  <p className="text-sm text-gray-600">
                    From your Supabase dashboard, go to Settings → API to find your URL and anon key
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Run the Database Setup Script</p>
                  <p className="text-sm text-gray-600">
                    Execute the SQL script from the scripts folder to create the required tables
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Set Environment Variables</p>
                  <p className="text-sm text-gray-600">
                    Add the following to your .env.local file or deployment environment:
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
              <pre className="text-sm overflow-x-auto">{envTemplate}</pre>
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-gray-800 border-gray-600 hover:bg-gray-700"
              >
                {copied ? "Copied!" : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                <strong>For Vercel deployment:</strong> Add these environment variables in your Vercel project settings
                under Environment Variables.
              </AlertDescription>
            </Alert>

            <div className="text-center pt-4">
              <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
                Refresh Page After Setup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
