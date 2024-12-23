'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useVerification } from '@/providers/VerifiedContext'

interface Message {
  id: string
  content: string
  createdAt: string
  imageUrl?: string
  isInitiallyUnblurred?: boolean
  userId: string
}

export function MessageFeed() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [unblurredCount, setUnblurredCount] = useState(4)
  const { userId } = useVerification()

  useEffect(() => {
    // Fetch initially unblurred messages (admin-selected)
    const initialUnblurredQuery = query(
      collection(db, 'messages'),
      where('isInitiallyUnblurred', '==', true),
      limit(4)
    )

    // Fetch remaining messages
    const remainingMessagesQuery = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    // Query to track user's messages
    const userMessagesQuery = query(
      collection(db, 'messages'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    let initialMessages: Message[] = []
    let remainingMessages: Message[] = []

    const unsubscribeInitial = onSnapshot(initialUnblurredQuery, (snapshot) => {
      initialMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[]

      setMessages([...initialMessages, ...remainingMessages])
    })

    const unsubscribeRemaining = onSnapshot(remainingMessagesQuery, (snapshot) => {
      remainingMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[]

      remainingMessages = remainingMessages.filter(message =>
        !initialMessages.some(m => m.id === message.id)
      )

      setMessages([...initialMessages, ...remainingMessages])
    })

    // Listen to user's messages count
    const unsubscribeUserMessages = onSnapshot(userMessagesQuery, (snapshot) => {
      const count = snapshot.docs.length && userId ? snapshot.docs.length : 0
      setUserMessageCount(count)
      console.log(userId, count)
      // Unblur 4 messages for each message sent (including initial 4)
      setUnblurredCount(Math.min(4 + (count * 4), 20))
    })

    // Cleanup function to unsubscribe from all listeners
    return () => {
      unsubscribeInitial()
      unsubscribeRemaining()
      unsubscribeUserMessages()
    }
  }, [userId])

  // Calculate remaining messages that can be unlocked
  const remainingToUnlock = Math.max(0, messages.length - unblurredCount)

  return (
    <div className="space-y-4 relative">
      {remainingToUnlock > 0 && (
        <Alert className="bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white mb-4 animate-pulse">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="font-medium">
            ¡Envía un mensaje para descubrir {Math.min(4, remainingToUnlock)} mensajes misteriosos más! ✨
          </AlertDescription>
        </Alert>
      )}

      <div className="max-h-96 overflow-auto space-y-4">
        {messages.map((message, index) => (
          <Card
            key={message.id}
            className={`p-4 ${index >= unblurredCount ? 'blur-sm hover:blur-md transition-all' : ''}`}
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
    </div>
  )
}