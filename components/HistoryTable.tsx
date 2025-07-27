"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, TrendingUp, Target } from "lucide-react"
import { useGrade } from "@/contexts/GradeContext"
import type { OanEntry } from "@/lib/supabase"

interface HistoryTableProps {
  entries: OanEntry[]
  onDeleteEntry: (id: string) => Promise<{ success: boolean; error?: string }>
}

export default function HistoryTable({ entries, onDeleteEntry }: HistoryTableProps) {
  const { selectedGrade } = useGrade()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const formatDateTime = (isoString: string) => {
    return new Date(isoString)
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "")
  }

  const formatValue = (value: number | null | undefined, decimals = 3) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "N/A"
    }
    return value.toFixed(decimals)
  }

  const getPredictionStatus = (actual: number, predicted: number | null | undefined) => {
    if (predicted === null || predicted === undefined || isNaN(predicted)) {
      return { status: "No Prediction", color: "bg-gray-500" }
    }

    const diff = Math.abs(actual - predicted)
    if (diff <= 1) return { status: "Excellent", color: "bg-green-500" }
    if (diff <= 2) return { status: "Good", color: "bg-blue-500" }
    if (diff <= 3) return { status: "Fair", color: "bg-yellow-500" }
    return { status: "Poor", color: "bg-red-500" }
  }

  const handleDeleteClick = (entryId: string) => {
    setEntryToDelete(entryId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    setDeleting(true)
    const result = await onDeleteEntry(entryToDelete)

    if (result.success) {
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }

    setDeleting(false)
  }

  const reversedEntries = [...entries].reverse()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Entry History & Predictions - {selectedGrade}
        </CardTitle>
        <div className="text-sm text-gray-600">
          Total entries for {selectedGrade}: {entries.length} | Predictions available:{" "}
          {entries.filter((e) => e.predicted_oan !== null && e.predicted_oan !== undefined).length}
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No history found for {selectedGrade}</p>
            <p className="text-sm">Add some data for this grade to get started with predictions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Actual OAN</TableHead>
                  <TableHead>Predicted OAN</TableHead>
                  <TableHead>Prediction Status</TableHead>
                  <TableHead>K2CO3 Flow</TableHead>
                  <TableHead>Oil Flow</TableHead>
                  <TableHead>LSL/Target/USL</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reversedEntries.map((entry, index) => {
                  const predictionStatus = getPredictionStatus(entry.oan, entry.predicted_oan)
                  const isLatest = index === 0

                  return (
                    <TableRow key={entry.id} className={`hover:bg-gray-50 ${isLatest ? "bg-blue-50" : ""}`}>
                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(entry.timestamp)}
                        {isLatest && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Latest
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">{formatValue(entry.oan)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${entry.predicted_oan !== null && entry.predicted_oan !== undefined ? "text-green-600" : "text-gray-400"}`}
                          >
                            {formatValue(entry.predicted_oan)}
                          </span>
                          {entry.predicted_oan !== null && entry.predicted_oan !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Δ {Math.abs(entry.oan - entry.predicted_oan).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white text-xs ${predictionStatus.color}`}>
                          {predictionStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatValue(entry.k2co3_flow)}</TableCell>
                      <TableCell>{formatValue(entry.oil_flow, 1)}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-red-600">{entry.lsl}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-green-600 font-medium">{entry.target_oan}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-red-600">{entry.usl}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(entry.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the entry and recalculate all predictions for{" "}
                {selectedGrade}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
