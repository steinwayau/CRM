'use client'

import { useState, useRef, useEffect } from 'react'

interface CompactDateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export default function CompactDateTimePicker({ 
  value, 
  onChange, 
  label = "Best Time to Follow Up",
  placeholder = "Select date and time",
  className = ""
}: CompactDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(
    value ? value.split('T')[0] : ''
  )
  const [selectedTime, setSelectedTime] = useState({
    hour: value ? (new Date(value).getHours() % 12 || 12) : 9,
    minute: value ? new Date(value).getMinutes() : 0,
    ampm: value ? (new Date(value).getHours() >= 12 ? 'PM' : 'AM') : 'AM'
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDisplayValue = () => {
    if (!selectedDate) return ''
    
    const date = new Date(selectedDate)
    const hour24 = selectedTime.ampm === 'PM' && selectedTime.hour !== 12 
      ? selectedTime.hour + 12 
      : selectedTime.ampm === 'AM' && selectedTime.hour === 12 
        ? 0 
        : selectedTime.hour
    
    date.setHours(hour24, selectedTime.minute)
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }
    return date.toLocaleDateString('en-AU', options)
  }

  const handleApply = () => {
    if (selectedDate) {
      const date = new Date(selectedDate)
      const hour24 = selectedTime.ampm === 'PM' && selectedTime.hour !== 12 
        ? selectedTime.hour + 12 
        : selectedTime.ampm === 'AM' && selectedTime.hour === 12 
          ? 0 
          : selectedTime.hour
      
      date.setHours(hour24, selectedTime.minute)
      onChange(date.toISOString())
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setSelectedDate('')
    onChange('')
    setIsOpen(false)
  }

  // Generate time options
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = [0, 15, 30, 45]

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Input Display */}
      <div
        onClick={() => setIsOpen(true)}
        className="relative w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? 'text-gray-900 text-sm' : 'text-gray-500 text-sm'}>
            {selectedDate ? formatDisplayValue() : placeholder}
          </span>
          <div className="flex items-center space-x-1">
            {selectedDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Compact Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="p-4">
            {/* Date Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Time Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
              <div className="grid grid-cols-4 gap-2">
                {/* Hour */}
                <select
                  value={selectedTime.hour}
                  onChange={(e) => setSelectedTime(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                  className="px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {hours.map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>

                {/* Minute */}
                <select
                  value={selectedTime.minute}
                  onChange={(e) => setSelectedTime(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
                  className="px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {minutes.map(minute => (
                    <option key={minute} value={minute}>
                      {minute.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>

                {/* AM/PM */}
                <select
                  value={selectedTime.ampm}
                  onChange={(e) => setSelectedTime(prev => ({ ...prev, ampm: e.target.value as 'AM' | 'PM' }))}
                  className="px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent col-span-2"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedDate}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 