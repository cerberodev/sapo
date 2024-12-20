'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  createdAt: string
  imageUrl?: string
}

export function MessageFeed() {
  const [messages, setMessages] = useState<Message[]>([])

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
    <div className="space-y-4 max-h-96 overflow-auto relative">
      {messages.map((message, index) => (
        <Card
          key={message.id}
          className={`p-4 ${index >= 3 ? 'blur-sm hover:blur-md transition-all' : ''}`}
        >
          <div className="flex gap-2">
            <div className="relative w-4 h-4 mb-auto">
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
            <div className="flex-1">
              <p className="text-sm text-[#827575]">{message.content}</p>
              {message.imageUrl && (
                <div className="mt-2 relative">
                  <div className="relative w-48 h-48">
                    <Image
                      src={message.imageUrl}
                      alt="Attached image"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}