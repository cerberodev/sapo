'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'

interface VerificationContextType {
    isVerified: boolean
    setIsVerified: (value: boolean) => void
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined)

export const useVerification = () => {
    const context = useContext(VerificationContext)
    if (context === undefined) {
        throw new Error('useVerification must be used within a VerificationProvider')
    }
    return context
}

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVerified, setIsVerified] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedVerification = localStorage.getItem('isVerified')
            if (storedVerification) {
                setIsVerified(true)
            }
        }
    }, [])

    const updateVerification = (value: boolean) => {
        setIsVerified(value)
        if (typeof window !== 'undefined') {
            localStorage.setItem('isVerified', value.toString())
        }
    }

    return (
        <VerificationContext.Provider value={{ isVerified, setIsVerified: updateVerification }}>
            {children}
        </VerificationContext.Provider>
    )
}

