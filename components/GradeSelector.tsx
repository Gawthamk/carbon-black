"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGrade } from "@/contexts/GradeContext"
import { GRADE_PRESETS } from "@/lib/supabase"
import { Target } from "lucide-react"

export default function GradeSelector() {
  const { selectedGrade, setSelectedGrade, availableGrades } = useGrade()
  const gradePresets = GRADE_PRESETS[selectedGrade]

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Active Grade</h3>
              <p className="text-sm text-gray-600">All data and calculations are filtered by this grade</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Current Specifications</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  LSL: {gradePresets.lsl}
                </Badge>
                <Badge variant="default" className="text-xs bg-green-600">
                  Target: {gradePresets.target}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  USL: {gradePresets.usl}
                </Badge>
              </div>
            </div>

            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-[140px] bg-white border-blue-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{grade}</span>
                      <span className="text-xs text-gray-500">
                        ({GRADE_PRESETS[grade].lsl}-{GRADE_PRESETS[grade].usl})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
