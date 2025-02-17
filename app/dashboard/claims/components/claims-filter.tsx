'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Claim } from '@/lib/api'

export interface FilterState {
  searchTerm?: string
  status?: Claim['status']
  dateRange?: {
    from: Date
    to: Date
  }
  minAmount?: number
  maxAmount?: number
}

interface ClaimsFilterProps {
  currentFilters: FilterState
  onFilterChange: (filters: FilterState) => void
}

export function ClaimsFilter({ currentFilters, onFilterChange }: ClaimsFilterProps): JSX.Element {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters)
  const [date, setDate] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: currentFilters.dateRange?.from,
    to: currentFilters.dateRange?.to,
  })

  useEffect((): void => {
    setLocalFilters(currentFilters)
    setDate({
      from: currentFilters.dateRange?.from,
      to: currentFilters.dateRange?.to,
    })
  }, [currentFilters])

  useEffect((): (() => void) => {
    const timer = setTimeout(() => {
      onFilterChange(localFilters)
    }, 500)

    return () => clearTimeout(timer)
  }, [localFilters, onFilterChange])

  const handleStatusChange = (value: string): void => {
    setLocalFilters(prev => ({
      ...prev,
      status: value as Claim['status'],
    }))
  }

  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }): void => {
    setDate(range)
    if (range.from && range.to) {
      setLocalFilters(prev => ({
        ...prev,
        dateRange: {
          from: range.from,
          to: range.to,
        },
      }))
    }
  }

  const handleAmountChange = (type: 'min' | 'max', value: string): void => {
    const numValue = value ? parseFloat(value) : undefined
    setLocalFilters(prev => ({
      ...prev,
      [type === 'min' ? 'minAmount' : 'maxAmount']: numValue,
    }))
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setLocalFilters(prev => ({
      ...prev,
      searchTerm: value || undefined,
    }))
  }

  const clearFilters = (): void => {
    setLocalFilters({})
    setDate({ from: undefined, to: undefined })
    onFilterChange({})
  }

  const hasActiveFilters: boolean = Object.values(localFilters).some(value => 
    value !== undefined && (typeof value === 'object' ? Object.keys(value).length > 0 : true)
  )

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search claims..."
            value={localFilters.searchTerm || ''}
            onChange={handleSearchChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={localFilters.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="DENIED">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={{ from: date?.from, to: date?.to }}
                onSelect={handleDateChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Amount Range</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={localFilters.minAmount || ''}
              onChange={(e) => handleAmountChange('min', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={localFilters.maxAmount || ''}
              onChange={(e) => handleAmountChange('max', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 