'use client'

import { useEffect, useState } from 'react'
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AnimatedNumber from './animate-number'

const ANIMATION_DURATION_MS = 750

export function MessageCount() {
    const [count, setCount] = useState(0)
    const [startingCount, setStartingCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isStartingCountLoading, setIsStartingCountLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'messages'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [])

    useEffect(() => {
        const fetchCount = async () => {
            const startingCount = doc(db, 'count', 'imZopcsjVcKLYGCwPE9T')
            const startingCountSnapshot = await getDoc(startingCount)

            if (startingCountSnapshot.exists()) {
                setStartingCount(startingCountSnapshot.data()?.count || 0)
                setIsStartingCountLoading(false)
            }
        }
        fetchCount()
    }, [])

    if (isLoading) {
        return <></>
    }
    return <AnimatedNumber endValue={count + startingCount} duration={ANIMATION_DURATION_MS} />
}
