'use client'

import { useEffect, useState } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AnimatedNumber from './animate-number'

const ANIMATION_DURATION_MS = 750

export function MessageCount() {
    const [count, setCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'messages'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [])

    if (isLoading) {
        return <></>
    }
    return <AnimatedNumber endValue={count + 503} duration={ANIMATION_DURATION_MS} />
}
