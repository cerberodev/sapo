'use client'

import { useEffect, useState } from 'react'

export function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState<string[]>([])

    useEffect(() => {
        function calculateTimeLeft() {
            // Get current time in Mexico City
            const now = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' })
            const currentTime = new Date(now)

            // Set target time to 6 PM today
            let targetTime = new Date(currentTime)
            targetTime.setHours(18, 0, 0, 0)

            // If it's past 6 PM, set target to 6 PM tomorrow
            if (currentTime > targetTime) {
                targetTime.setDate(targetTime.getDate() + 1)
            }

            // Calculate difference in milliseconds
            const diff = targetTime.getTime() - currentTime.getTime()

            // Convert to hours, minutes, seconds
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)
            const deciseconds = Math.floor((diff % 1000) / 100)

            // Format each number segment
            return [
                hours.toString().padStart(2, '0').split(''),
                minutes.toString().padStart(2, '0').split(''),
                seconds.toString().padStart(2, '0').split(''),
                [deciseconds.toString()]
            ].flat()
        }

        // Update timer immediately
        setTimeLeft(calculateTimeLeft())

        // Update timer every 100ms
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 100)

        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex flex-col items-center gap-1 text-center">
            <span className='text-4xl'>💣</span>
            <div className="flex items-center gap-1">
                {timeLeft.slice(0, (timeLeft?.length ?? 1) - 1).map((digit, index) => (
                    <>
                        <div
                            key={`digit-${index}`}
                            className="w-6 h-8 bg-white flex items-center justify-center font-mono text-xl border border-black"
                        >
                            {digit}
                        </div>
                        {/* Add separator after hours and minutes */}
                        {(index === 1 || index === 3) && (
                            <div className="font-mono text-xl text-white mx-0.5">:</div>
                        )}
                    </>
                ))}
            </div>
        </div>
    )
}

