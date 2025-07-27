"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calculator, Target, Activity } from "lucide-react"

interface CalculationPanelProps {
  calculations: {
    meanOan: number | null
    meanK2co3: number | null
    meanOil: number | null
    meanInverseK2co3: number | null
    coeffB1: number | null
    coeffB2: number | null
    interceptB0: number | null
    predictedOan: number | null
    k2co3Optimal: number | null
    oilFlowOptimal: number | null
    standardDeviation: number | null
    cpu: number | null
    cpl: number | null
    cpk: number | null
    entryCount: number
  }
}

export default function CalculationPanel({ calculations }: CalculationPanelProps) {
  const formatValue = (value: number | null, decimals = 4) => {
    return value !== null && !isNaN(value) && calculations.entryCount > 0 ? value.toFixed(decimals) : "N/A"
  }

  const getCpkColor = (cpk: number | null) => {
    if (cpk === null || isNaN(cpk) || calculations.entryCount === 0) return "bg-gray-500"
    if (cpk >= 1.33) return "bg-green-500"
    if (cpk >= 1.0) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getCpkStatus = (cpk: number | null) => {
    if (cpk === null || isNaN(cpk) || calculations.entryCount === 0) return "No Data"
    if (cpk >= 1.33) return "Excellent"
    if (cpk >= 1.0) return "Acceptable"
    return "Poor"
  }

  return (
    <div className="space-y-4">
      {/* Main Calculations Card */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            Calculations & Prediction
          </CardTitle>
          <div className="text-sm text-gray-600">
            Based on {calculations.entryCount} data points
            {calculations.entryCount >= 2 ? " (Calculations Active)" : " (Need 2+ entries for calculations)"}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mean Values - only show if we have data */}
          {calculations.entryCount > 0 && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-600">Mean OAN</div>
                <div className="font-semibold text-blue-700">{formatValue(calculations.meanOan, 3)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Mean K2CO3</div>
                <div className="font-semibold text-blue-700">{formatValue(calculations.meanK2co3, 3)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Mean Oil</div>
                <div className="font-semibold text-blue-700">{formatValue(calculations.meanOil, 3)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Mean Inv K2CO3</div>
                <div className="font-semibold text-blue-700">{formatValue(calculations.meanInverseK2co3, 6)}</div>
              </div>
            </div>
          )}

          {/* Show message when no data */}
          {calculations.entryCount === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No data available</p>
              <p className="text-sm">Add entries for the selected grade to see calculations.</p>
            </div>
          )}

          {/* Coefficients - only show if we have calculations */}
          {calculations.entryCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">COEFF (B1)</span>
                <Badge
                  variant="secondary"
                  className={calculations.coeffB1 !== null && calculations.entryCount >= 2 ? "animate-pulse" : ""}
                >
                  {formatValue(calculations.coeffB1)}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">COEFF (B2)</span>
                <Badge
                  variant="secondary"
                  className={calculations.coeffB2 !== null && calculations.entryCount >= 2 ? "animate-pulse" : ""}
                >
                  {formatValue(calculations.coeffB2)}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">INTERCEPT (B0)</span>
                <Badge
                  variant="secondary"
                  className={calculations.interceptB0 !== null && calculations.entryCount >= 2 ? "animate-pulse" : ""}
                >
                  {formatValue(calculations.interceptB0)}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-4 mt-4 border-t-2 border-green-200 bg-green-50 rounded-lg px-4">
                <span className="font-medium text-lg text-gray-700 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Predicted OAN
                </span>
                <Badge
                  className={`bg-green-600 text-white text-lg px-4 py-2 ${
                    calculations.predictedOan !== null && calculations.entryCount >= 2 ? "animate-bounce" : ""
                  }`}
                >
                  {formatValue(calculations.predictedOan, 3)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Card - only show if we have data */}
      {calculations.entryCount > 0 && (
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Process Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">Optimal K2CO3 Flow</span>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                {formatValue(calculations.k2co3Optimal, 3)}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">Optimal Oil Flow</span>
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                {formatValue(calculations.oilFlowOptimal, 3)}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">Standard Deviation</span>
              <Badge variant="outline">{formatValue(calculations.standardDeviation, 3)}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-xs text-gray-600">CPU</div>
                <Badge variant="outline" className="w-full justify-center">
                  {formatValue(calculations.cpu, 3)}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">CPL</div>
                <Badge variant="outline" className="w-full justify-center">
                  {formatValue(calculations.cpl, 3)}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Cpk</div>
                <div className="space-y-1">
                  <Badge
                    className={`w-full justify-center text-white ${getCpkColor(calculations.cpk)} ${
                      calculations.cpk !== null && calculations.entryCount >= 2 ? "animate-pulse" : ""
                    }`}
                  >
                    {formatValue(calculations.cpk, 3)}
                  </Badge>
                  <div className="text-xs text-gray-500">{getCpkStatus(calculations.cpk)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Data Entries</span>
              <Badge variant="outline">{calculations.entryCount}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Calculation Status</span>
              <Badge variant={calculations.entryCount >= 2 ? "default" : "secondary"}>
                {calculations.entryCount >= 2 ? "Active" : "Waiting for data"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Prediction Available</span>
              <Badge
                variant={calculations.predictedOan !== null && calculations.entryCount >= 2 ? "default" : "secondary"}
              >
                {calculations.predictedOan !== null && calculations.entryCount >= 2 ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
