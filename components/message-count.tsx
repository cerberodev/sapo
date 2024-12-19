'use client'

import { useEffect, useState } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function MessageCount() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const q = query(collection(db, 'messages'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size)
        })

        return () => unsubscribe()
    }, [])

    return (
        <p className="mt-4 text-2xl font-semibold text-red-500">{count + 503}</p>
    )
}
