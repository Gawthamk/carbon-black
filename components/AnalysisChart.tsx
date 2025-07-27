"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LineChart } from "lucide-react"
import { useGrade } from "@/contexts/GradeContext"
import type { OanEntry } from "@/lib/supabase"

interface AnalysisChartProps {
  entries: OanEntry[]
}

export default function AnalysisChart({ entries }: AnalysisChartProps) {
  const { selectedGrade } = useGrade()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [chartReady, setChartReady] = useState(false)

  // Filter entries by selected grade (entries are already filtered in dashboard)
  const filteredData = entries.filter((entry) => entry.grade === selectedGrade)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const loadChartSafely = async () => {
      try {
        setChartLoading(true)
        setChartError(null)
        setChartReady(false)

        console.log("Loading Chart.js components...")

        // Add timeout to prevent hanging during build
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.error("Chart loading timeout")
            setChartError("Chart loading timeout. Using table view.")
            setChartLoading(false)
          }
        }, 5000)

        // Check if we're in browser environment
        if (typeof window === "undefined") {
          clearTimeout(timeoutId)
          if (isMounted) {
            setChartError("Chart not available during server-side rendering")
            setChartLoading(false)
          }
          return
        }

        // Dynamic import with better error handling
        const chartModule = (await Promise.race([
          import("chart.js"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Import timeout")), 4000)),
        ])) as any

        if (!isMounted) return

        clearTimeout(timeoutId)

        const {
          Chart: ChartJS,
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          LineController,
          Title,
          Tooltip,
          Legend,
          Filler,
        } = chartModule

        // Register components with error handling
        try {
          ChartJS.register(
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            LineController,
            Title,
            Tooltip,
            Legend,
            Filler,
          )
          console.log("Chart.js components registered successfully")
        } catch (regError) {
          console.error("Error registering Chart.js components:", regError)
          throw regError
        }

        if (isMounted) {
          setChartReady(true)
          setChartLoading(false)
          // Create chart after ensuring DOM is ready
          requestAnimationFrame(() => {
            if (isMounted && chartRef.current) {
              createChart(ChartJS)
            }
          })
        }
      } catch (error) {
        console.error("Error loading Chart.js:", error)
        clearTimeout(timeoutId)
        if (isMounted) {
          setChartError("Chart unavailable. Using table view.")
          setChartLoading(false)
          setChartReady(false)
        }
      }
    }

    // Only load chart in browser environment
    if (typeof window !== "undefined") {
      loadChartSafely()
    } else {
      setChartError("Chart not available during server-side rendering")
      setChartLoading(false)
    }

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy()
        } catch (e) {
          console.warn("Error destroying chart:", e)
        }
        chartInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (chartReady && chartInstanceRef.current) {
      updateChart()
    }
  }, [filteredData, chartReady, selectedGrade])

  const createChart = (ChartJS: any) => {
    if (!chartRef.current || !ChartJS) return

    try {
      const ctx = chartRef.current.getContext("2d")
      if (!ctx) return

      // Destroy existing chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }

      chartInstanceRef.current = new ChartJS(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index" as const,
            intersect: false,
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: "Time",
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: "OAN Value",
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "top" as const,
            },
            tooltip: {
              mode: "index" as const,
              intersect: false,
            },
          },
        },
      })

      console.log("Chart created successfully")
      updateChart()
    } catch (error) {
      console.error("Error creating chart:", error)
      setChartError("Failed to create chart")
    }
  }

  const updateChart = () => {
    if (!chartInstanceRef.current) return

    try {
      if (filteredData.length === 0) {
        chartInstanceRef.current.data.labels = []
        chartInstanceRef.current.data.datasets = []
        chartInstanceRef.current.update("none")
        return
      }

      // Sort data by timestamp
      const sortedData = [...filteredData].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )

      // Prepare labels
      const labels = sortedData.map((entry, index) => {
        const date = new Date(entry.timestamp)
        return `${index + 1}. ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      })

      // Prepare datasets
      const datasets = [
        {
          label: "Actual OAN",
          data: sortedData.map((entry) => entry.oan),
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          tension: 0.1,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#4f46e5",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        },
      ]

      // Add predicted OAN if available
      const predictedData = sortedData.map((entry) => entry.predicted_oan || null)
      const hasPredictions = predictedData.some((val) => val !== null)

      if (hasPredictions) {
        datasets.push({
          label: "Predicted OAN",
          data: predictedData,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          borderDash: [5, 5],
          spanGaps: true,
        })
      }

      // Add target line if we have data
      if (sortedData.length > 0) {
        const targetValue = sortedData[sortedData.length - 1].target_oan
        datasets.push({
          label: "Target OAN",
          data: new Array(sortedData.length).fill(targetValue),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.05)",
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderDash: [10, 5],
          borderWidth: 2,
        })

        // Add USL line
        const uslValue = sortedData[sortedData.length - 1].usl
        datasets.push({
          label: "USL",
          data: new Array(sortedData.length).fill(uslValue),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderDash: [3, 3],
          borderWidth: 1,
        })

        // Add LSL line
        const lslValue = sortedData[sortedData.length - 1].lsl
        datasets.push({
          label: "LSL",
          data: new Array(sortedData.length).fill(lslValue),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderDash: [3, 3],
          borderWidth: 1,
        })
      }

      // Update chart
      chartInstanceRef.current.data.labels = labels
      chartInstanceRef.current.data.datasets = datasets
      chartInstanceRef.current.update("none")

      console.log("Chart updated successfully with", sortedData.length, "data points for grade", selectedGrade)
    } catch (error) {
      console.error("Error updating chart:", error)
      setChartError("Error updating chart display")
    }
  }

  // Fallback table view when chart fails
  const renderFallbackTable = () => (
    <div className="space-y-4">
      <div className="text-center text-gray-600 mb-4">
        <LineChart className="w-8 h-8 mx-auto mb-2" />
        <p>Chart view unavailable. Showing data table instead.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actual OAN</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Predicted OAN</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Target</th>
            </tr>
          </thead>
          <tbody>
            {filteredData
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-600">
                    {entry.oan.toFixed(3)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">
                    {entry.predicted_oan ? entry.predicted_oan.toFixed(3) : "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{entry.target_oan}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>OAN Analysis Chart - {selectedGrade}</CardTitle>
        <div className="text-sm text-gray-600">
          Showing {filteredData.length} entries for grade {selectedGrade}
          {filteredData.filter((e) => e.predicted_oan !== null).length > 0 &&
            ` • ${filteredData.filter((e) => e.predicted_oan !== null).length} with predictions`}
        </div>
      </CardHeader>
      <CardContent>
        {chartLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading chart...</span>
          </div>
        ) : chartError ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>{chartError}</AlertDescription>
            </Alert>
            {filteredData.length > 0 && renderFallbackTable()}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data available for {selectedGrade}</h3>
            <p className="mt-1 text-sm text-gray-500">Add some data for this grade to see the analysis chart.</p>
          </div>
        ) : chartReady ? (
          <div className="space-y-4">
            <div style={{ position: "relative", height: "60vh", width: "100%" }}>
              <canvas ref={chartRef} />
            </div>
            <div className="text-xs text-gray-500 text-center">
              Chart shows actual vs predicted OAN values with target and specification limits for {selectedGrade}
            </div>
          </div>
        ) : (
          renderFallbackTable()
        )}
      </CardContent>
    </Card>
  )
}
