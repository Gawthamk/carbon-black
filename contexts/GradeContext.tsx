"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Grade = "N660" | "N550" | "N772" | "N774" | "N762"

interface GradeContextType {
  selectedGrade: Grade
  setSelectedGrade: (grade: Grade) => void
  availableGrades: Grade[]
}

const GradeContext = createContext<GradeContextType | undefined>(undefined)

export function GradeProvider({ children }: { children: React.ReactNode }) {
  const [selectedGrade, setSelectedGradeState] = useState<Grade>("N660")
  const availableGrades: Grade[] = ["N660", "N550", "N772", "N774", "N762"]

  // Load grade from localStorage on mount
  useEffect(() => {
    const savedGrade = localStorage.getItem("selectedGrade") as Grade
    if (savedGrade && availableGrades.includes(savedGrade)) {
      setSelectedGradeState(savedGrade)
    }
  }, [])

  // Save grade to localStorage when it changes
  const setSelectedGrade = (grade: Grade) => {
    setSelectedGradeState(grade)
    localStorage.setItem("selectedGrade", grade)
  }

  return (
    <GradeContext.Provider
      value={{
        selectedGrade,
        setSelectedGrade,
        availableGrades,
      }}
    >
      {children}
    </GradeContext.Provider>
  )
}

export function useGrade() {
  const context = useContext(GradeContext)
  if (context === undefined) {
    throw new Error("useGrade must be used within a GradeProvider")
  }
  return context
}
