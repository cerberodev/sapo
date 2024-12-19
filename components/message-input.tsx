'use client'

import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export function MessageInput() {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      // Get or generate user ID from localStorage
      let userId = localStorage.getItem('sapo_user_id')
      if (!userId) {
        userId = crypto.randomUUID()
        localStorage.setItem('sapo_user_id', userId)
      }

      await addDoc(collection(db, 'messages'), {
        content: message,
        userId,
        createdAt: new Date().toISOString(),
      })

      setMessage('')
      toast({
        action: (
          <Image
            src='/check.svg'
            width={25}
            height={25}
            alt='check'
          />
        ),
        title: "¡Un sapo más!",
        duration: 3000,
        style: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column-reverse',
          gap: 2,
          borderRadius: '1rem',
        }
      })
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="bg-transparent shadow-xl border-none">
        <div className="flex items-center justify-between p-2 px-3 bg-white rounded-t-xl rounded-b-none w-full">
          <p className='font-semibold'>
            Expose lo más Whitexican de la Ibero
          </p>
        </div>

        <Textarea
          placeholder="Envía mensajes anónimos a toda la Ibero"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-white bg-opacity-20 rounded-b-xl rounded-t-none backdrop-blur-sm px-3 border-none placeholder:text-[#827575] font-semibold text-sm !outline-none focus-visible:!outline-none !outline-transparent focus-visible:!outline-transparent focus:!ring-0 focus:!ring-transparent"
          rows={8}
        />
      </Card>
      <div className="flex flex-col items-center justify-between !mt-2 gap-6">
        <div className="flex items-center gap-1 text-sm text-white font-bold">
          🔒
          <span>100% anónimo</span>
          🔒
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-white text-[#4AB84A] font-bold rounded-3xl py-0 h-8">
          {isSubmitting ? 'Sending...' : 'Sapo'}
        </Button>
      </div>
    </>
  )
}

