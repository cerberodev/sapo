'use client'

import { useEffect, useState, useRef } from 'react'
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useVerification } from '@/providers/VerifiedContext'
import { MessageActions } from '@/components/message-actions'
import { useSearchParams } from 'next/navigation'

interface Message {
  id: string
  content: string
  createdAt: string
  imageUrl?: string
  isInitiallyUnblurred?: boolean
  userId: string
  isSelected?: boolean
  initialVotes: number
  initialShares: number
}

export function MessageFeed() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [unblurredCount, setUnblurredCount] = useState(4)
  const { userId } = useVerification()
  const [feedMode, setFeedMode] = useState<'auto' | 'manual'>('auto')
  const searchParams = useSearchParams()
  const messageRefs = useRef<{ [key: string]: HTMLDivElement }>({})
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Handle scrolling to shared message if message ID is in URL
    const sharedMessageId = searchParams.get('message')
    if (sharedMessageId && messageRefs.current[sharedMessageId] && !scrolled) {
      setTimeout(() => {
        messageRefs.current[sharedMessageId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
        // Add a highlight animation class
        messageRefs.current[sharedMessageId]?.classList.add('highlight-message')
        // Remove the highlight after animation
        setTimeout(() => {
          messageRefs.current[sharedMessageId]?.classList.remove('highlight-message')
          setScrolled(true)
        }, 2000)
      }, 500) // Small delay to ensure content is loaded
    }
  }, [searchParams, messages])

  useEffect(() => {
    // Your existing Firebase listeners...
    const feedModeQuery = query(collection(db, 'settings'), where('id', '==', 'feedMode'))
    const unsubscribeFeedMode = onSnapshot(feedModeQuery, (snapshot) => {
      if (!snapshot.empty) {
        setFeedMode(snapshot.docs[0].data().mode)
      }
    })

    const initialUnblurredQuery = query(
      collection(db, 'messages'),
      where('isInitiallyUnblurred', '==', true),
      limit(4)
    )

    let messagesQuery
    if (feedMode === 'auto') {
      messagesQuery = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(20)
      )
    } else {
      messagesQuery = query(
        collection(db, 'messages'),
        where('isSelected', '==', true),
        orderBy('displayOrder', 'asc'),
        limit(20)
      )
    }

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

    const unsubscribeRemaining = onSnapshot(messagesQuery, (snapshot) => {
      remainingMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[]

      remainingMessages = remainingMessages.filter(message =>
        !initialMessages.some(m => m.id === message.id)
      )

      setMessages([...initialMessages, ...remainingMessages])
    })

    const unsubscribeUserMessages = onSnapshot(userMessagesQuery, (snapshot) => {
      const count = snapshot.docs.length && userId ? snapshot.docs.length : 0
      setUserMessageCount(count)
      setUnblurredCount(Math.min(4 + (count * 4), 20))
    })

    return () => {
      unsubscribeInitial()
      unsubscribeRemaining()
      unsubscribeUserMessages()
      unsubscribeFeedMode()
    }
  }, [userId, feedMode])

  const remainingToUnlock = Math.max(0, messages.length - unblurredCount)

  return (
    <div className="space-y-4 relative">
      {remainingToUnlock > 0 && (
        <Alert className="bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white mb-4 animate-pulse">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="font-medium">
            ¡Envía un Sapo para descubrir {Math.min(4, remainingToUnlock)} Sapos más! ✨
          </AlertDescription>
        </Alert>
      )}

      <div className="max-h-96 overflow-auto space-y-4">
        {messages.map((message, index) => (
          <Card
            key={message.id}
            ref={el => {
              if (el) messageRefs.current[message.id] = el
            }}
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
                <MessageActions
                  messageId={message.id}
                  initialVotes={message.initialVotes || 0}
                  initialShares={message.initialShares || 0}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}