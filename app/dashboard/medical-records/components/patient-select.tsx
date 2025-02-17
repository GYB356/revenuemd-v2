'use client'

import { useState, useEffect } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Patient {
  id: string
  name: string
  dateOfBirth: string
  contactInfo: string
}

interface PatientSelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function PatientSelect({ value, onValueChange, disabled }: PatientSelectProps) {
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/patients')
      if (!response.ok) throw new Error('Failed to load patients')
      const data = await response.json()
      setPatients(data.patients)
    } catch (error) {
      setError('Failed to load patients. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedPatient = patients.find(patient => patient.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value && selectedPatient
            ? selectedPatient.name
            : "Select patient..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search patients..." />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500">{error}</div>
            ) : (
              "No patient found."
            )}
          </CommandEmpty>
          <CommandGroup>
            {patients.map((patient) => (
              <CommandItem
                key={patient.id}
                value={patient.id}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === patient.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{patient.name}</span>
                  <span className="text-sm text-muted-foreground">
                    Born: {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 