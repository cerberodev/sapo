'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
}

export function MessageFeed() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (localStorage) {
      const isVerified = localStorage.getItem('isVerified')
      if (isVerified) {
        setIsVerified(true)
      }
    }
  }, [])

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
    <div className="space-y-4">
      {messages.map((message, index) => (
        <Card
          key={message.id}
          className={`p-4 ${index >= 3 && !isVerified ? 'blur-sm hover:blur-md transition-all' : ''}`}
        >
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm">{message.content}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

