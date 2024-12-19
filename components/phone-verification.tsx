'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search } from 'lucide-react'

interface Country {
  name: string
  code: string
  flag: string
}

const COUNTRIES: Country[] = [
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Afghanistan', code: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: '+355', flag: '🇦🇱' },
  // Add more countries as needed
]

export function PhoneVerification() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [phone, setPhone] = useState('')
  const [search, setSearch] = useState('')

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleVerify = async () => {
    // Here you would typically implement phone verification
    // For demo purposes, we'll just mark as verified
    localStorage.setItem('sapo_verified', 'true')
    setIsOpen(false)
  }

  return (
    <>
      <Card className="p-4 text-center">
        <h3 className="text-lg font-semibold mb-4">
          Revela los Secretos de la Ibero
        </h3>
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            className="w-[100px]"
            onClick={() => setIsOpen(true)}
          >
            {selectedCountry.flag} {selectedCountry.code}
          </Button>
          <Input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={handleVerify}>
          Join waiting list....
        </Button>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Country</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[300px] overflow-auto">
            {filteredCountries.map((country) => (
              <Button
                key={country.code}
                variant="ghost"
                className="w-full justify-between"
                onClick={() => {
                  setSelectedCountry(country)
                  setIsOpen(false)
                }}
              >
                <span>
                  {country.flag} {country.name}
                </span>
                <span>{country.code}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

