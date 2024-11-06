// src/components/shared/team-color-picker.tsx
'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

// Common sports team colors
const teamColors = [
  { name: 'Navy Blue', value: '#1e3a8a' },
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Cardinal Red', value: '#991b1b' },
  { name: 'Forest Green', value: '#166534' },
  { name: 'Kelly Green', value: '#15803d' },
  { name: 'Purple', value: '#7e22ce' },
  { name: 'Gold', value: '#ca8a04' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Black', value: '#171717' },
  { name: 'Maroon', value: '#7f1d1d' },
  { name: 'Teal', value: '#0d9488' },
]

interface TeamColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function TeamColorPicker({ value, onChange }: TeamColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [hexValue, setHexValue] = useState(value)
  
  const selectedColor = teamColors.find(color => color.value === value)

  // Validate and format hex color
  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex)

  const formatHexValue = (hex: string) => {
    // Remove non-hex characters
    hex = hex.replace(/[^0-9a-f]/gi, '')
    
    // Ensure 6 digits
    if (hex.length > 6) hex = hex.slice(0, 6)
    
    // Add # prefix if missing
    if (hex && !hex.startsWith('#')) hex = '#' + hex
    
    return hex.toUpperCase()
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = formatHexValue(e.target.value)
    setHexValue(newValue)
    
    // Only update the actual color if it's a valid hex
    if (isValidHex(newValue)) {
      onChange(newValue)
    }
  }

  const handleHexBlur = () => {
    // On blur, reset to current value if invalid
    if (!isValidHex(hexValue)) {
      setHexValue(value)
    }
  }

  // Keep hex input in sync with color picker
  const handleColorPickerChange = (newColor: string) => {
    setHexValue(newColor.toUpperCase())
    onChange(newColor)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: value }}
            />
            <span>{selectedColor?.name || 'Custom Color'}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-2" 
        align="start"
        onInteractOutside={(e) => {
          // Don't close if clicking the color picker
          if (showColorPicker) {
            e.preventDefault()
          }
        }}
      >
        {showColorPicker ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowColorPicker(false)
                  setHexValue(value)  // Reset hex input
                }}
              >
                ← Back
              </Button>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: value }}
                />
                <Input 
                  value={hexValue}
                  onChange={handleHexChange}
                  onBlur={handleHexBlur}
                  className="w-24 font-mono h-8 text-sm uppercase"
                  maxLength={7}
                  spellCheck={false}
                  placeholder="#000000"
                />
              </div>
            </div>
            <HexColorPicker 
              color={value} 
              onChange={handleColorPickerChange}
            />
            <Button
              className="w-full"
              onClick={() => {
                setShowColorPicker(false)
                setOpen(false)
              }}
            >
              Select Color
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1">
              {teamColors.map((color) => (
                <button
                  key={color.value}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground min-w-[145px]',
                    value === color.value && 'bg-accent'
                  )}
                  onClick={() => {
                    onChange(color.value)
                    setHexValue(color.value)
                    setOpen(false)
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="truncate">{color.name}</span>
                  {value === color.value && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
            <Separator className="my-2" />
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                !selectedColor && 'bg-accent'
              )}
              onClick={() => setShowColorPicker(true)}
            >
              <div 
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: value }}
              />
              <span>Custom Color</span>
              {!selectedColor && <Check className="ml-auto h-4 w-4" />}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}