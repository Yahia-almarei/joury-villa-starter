'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { countryCodes, popularCountryCodes, type CountryCode } from '@/lib/country-codes'

interface CountryCodeSelectProps {
  value: string
  onChange: (countryCode: CountryCode) => void
  placeholder?: string
}

export function CountryCodeSelect({ value, onChange, placeholder = "Select country" }: CountryCodeSelectProps) {
  const [showAll, setShowAll] = useState(false)

  const selectedCountry = countryCodes.find(country => country.dialCode === value)

  const handleSelect = (dialCode: string) => {
    const country = countryCodes.find(c => c.dialCode === dialCode)
    if (country) {
      onChange(country)
    }
  }

  return (
      <Select value={value} onValueChange={handleSelect}>
        <SelectTrigger className="w-[100px]">
          <SelectValue>
            {selectedCountry ? (
              <div className="flex items-center gap-1">
                <span className="text-xs">{selectedCountry.flag}</span>
                <span className="text-sm font-mono">{selectedCountry.dialCode}</span>
              </div>
            ) : (
              <span className="text-sm">Select</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!showAll && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Popular Countries
              </div>
              {popularCountryCodes.map((country) => (
                <SelectItem key={country.code} value={country.dialCode}>
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="text-muted-foreground ml-auto">{country.dialCode}</span>
                  </div>
                </SelectItem>
              ))}
              <div className="border-t my-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs"
                  onClick={() => setShowAll(true)}
                >
                  Show all countries...
                </Button>
              </div>
            </>
          )}
          
          {showAll && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                All Countries
              </div>
              {countryCodes.map((country) => (
                <SelectItem key={country.code} value={country.dialCode}>
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="text-muted-foreground ml-auto">{country.dialCode}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
  )
}