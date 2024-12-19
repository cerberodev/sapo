'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { useVerification } from '@/providers/VerifiedContext'

interface Message {
  id: string
  content: string
  createdAt: string
}

export function MessageFeed() {
  const [messages, setMessages] = useState<Message[]>([])
  const { isVerified, setIsVerified } = useVerification()

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="space-y-4 max-h-80 overflow-auto">
      {messages.map((message, index) => (
        <Card
          key={message.id}
          className={`p-4 ${index >= 3 && !isVerified ? 'blur-sm hover:blur-md transition-all' : ''}`}
        >
          <div className="flex gap-2">
            <div className="relative w-4 h-4 my-auto">
              <Image
                src='/cube.svg'
                width={50}
                height={50}
                alt='cube'
                className='absolute w-4 h-4'
              />
              <Image
                src='/I.svg'
                width={50}
                height={50}
                alt='I'
                className='absolute w-3 h-3 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
              />
            </div>
            <p className="text-sm">{message.content}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

