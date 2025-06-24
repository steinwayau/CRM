'use client'

import { useState, useEffect, useRef } from 'react'
import { searchSuburbs } from '@/lib/australian-suburbs'

interface SuburbAutocompleteProps {
  value: string
  onChange: (value: string) => void
  state: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function SuburbAutocomplete({
  value,
  onChange,
  state,
  placeholder = "Type suburb name...",
  className = "",
  disabled = false
}: SuburbAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Update suggestions when value or state changes
  useEffect(() => {
    if (!state) {
      setSuggestions([])
      return
    }

    const newSuggestions = searchSuburbs(state, value)
    setSuggestions(newSuggestions)
    setHighlightedIndex(-1)
  }, [value, state])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suburb: string) => {
    onChange(suburb)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionClick(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])

  const showSuggestions = isOpen && suggestions.length > 0 && state

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => state && setIsOpen(true)}
        placeholder={state ? placeholder : "Select a state first"}
        disabled={disabled || !state}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
      />
      
      {showSuggestions && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suburb, index) => (
            <div
              key={suburb}
              className={`
                px-3 py-2 cursor-pointer transition-colors
                ${index === highlightedIndex 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'hover:bg-gray-100'
                }
              `}
              onClick={() => handleSuggestionClick(suburb)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suburb}
            </div>
          ))}
        </div>
      )}
      
      {!state && (
        <div className="text-sm text-gray-500 mt-1">
          Please select a state to enable suburb search
        </div>
      )}
    </div>
  )
} 