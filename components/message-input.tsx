'use client'

import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export function MessageInput() {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-4">
      <Textarea
        placeholder="Expose lo más Whitexican de la Ibero"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="mb-4"
        rows={4}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>100% anónimo</span>
          <Lock className="h-4 w-4" />
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </Card>
  )
}

