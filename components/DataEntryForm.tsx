"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GRADE_PRESETS } from "@/lib/supabase"
import { useGrade } from "@/contexts/GradeContext"
import { Loader2 } from "lucide-react"

interface DataEntryFormProps {
  onAddEntry: (data: any) => Promise<{ success: boolean; error?: string }>
  onCalculationsUpdate: (calculations: any) => void
}

export default function DataEntryForm({ onAddEntry, onCalculationsUpdate }: DataEntryFormProps) {
  const { selectedGrade } = useGrade()
  const [formData, setFormData] = useState({
    oan: "",
    date: "",
    time: "",
    k2co3Flow: "",
    oilFlow: "",
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const gradePresets = GRADE_PRESETS[selectedGrade]

  useEffect(() => {
    // Set default date and time
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")

    setFormData((prev) => ({
      ...prev,
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    }))
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    return (
      formData.oan &&
      formData.date &&
      formData.time &&
      formData.k2co3Flow &&
      formData.oilFlow &&
      !isNaN(Number(formData.oan)) &&
      !isNaN(Number(formData.k2co3Flow)) &&
      !isNaN(Number(formData.oilFlow)) &&
      Number(formData.k2co3Flow) > 0 && // Prevent division by zero
      Number(formData.oilFlow) > 0
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setLoading(true)
    setMessage({ text: "", type: "" })

    try {
      const timestamp = new Date(`${formData.date}T${formData.time}`).toISOString()

      const entryData = {
        grade: selectedGrade, // Use the selected grade from context
        oan: Number.parseFloat(formData.oan),
        lsl: gradePresets.lsl,
        usl: gradePresets.usl,
        target_oan: gradePresets.target,
        k2co3_flow: Number.parseFloat(formData.k2co3Flow),
        oil_flow: Number.parseFloat(formData.oilFlow),
        timestamp,
      }

      console.log("Submitting entry data:", entryData)

      const result = await onAddEntry(entryData)

      if (result.success) {
        setMessage({ text: "Entry added successfully!", type: "success" })
        // Reset form but keep date/time
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, "0")
        const day = String(now.getDate()).padStart(2, "0")
        const hours = String(now.getHours()).padStart(2, "0")
        const minutes = String(now.getMinutes()).padStart(2, "0")

        setFormData((prev) => ({
          ...prev,
          oan: "",
          date: `${year}-${month}-${day}`,
          time: `${hours}:${minutes}`,
          k2co3Flow: "",
          oilFlow: "",
        }))
      } else {
        setMessage({ text: result.error || "Failed to add entry", type: "error" })
      }
    } catch (err: any) {
      console.error("Error in form submission:", err)
      setMessage({ text: "An unexpected error occurred", type: "error" })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ text: "", type: "" }), 4000)
    }
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Input Data for {selectedGrade}
        </CardTitle>
        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
          <strong>Active Grade:</strong> {selectedGrade} | LSL: {gradePresets.lsl} | Target: {gradePresets.target} |
          USL: {gradePresets.usl}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="oan">OAN Current *</Label>
              <Input
                id="oan"
                type="number"
                step="0.001"
                min="0"
                value={formData.oan}
                onChange={(e) => handleInputChange("oan", e.target.value)}
                className="transition-all duration-200 focus:scale-105"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="transition-all duration-200 focus:scale-105"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                className="transition-all duration-200 focus:scale-105"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="k2co3-flow">K2CO3 Flow *</Label>
              <Input
                id="k2co3-flow"
                type="number"
                step="0.001"
                min="0.001"
                value={formData.k2co3Flow}
                onChange={(e) => handleInputChange("k2co3Flow", e.target.value)}
                className="transition-all duration-200 focus:scale-105"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oil-flow">Oil Flow *</Label>
              <Input
                id="oil-flow"
                type="number"
                step="0.001"
                min="0.001"
                value={formData.oilFlow}
                onChange={(e) => handleInputChange("oilFlow", e.target.value)}
                className="transition-all duration-200 focus:scale-105"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <div className="flex-grow">
              {message.text && (
                <Alert variant={message.type === "error" ? "destructive" : "default"} className="animate-slideIn">
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
            </div>
            <Button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </div>
              ) : (
                "Add Entry to History"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
