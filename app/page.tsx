import { Metadata } from 'next'
import { MessageFeed } from '@/components/message-feed'
import { MessageInput } from '@/components/message-input'
import { PhoneVerification } from '@/components/phone-verification'
import Image from 'next/image'
import { MessageCount } from '@/components/message-count'

export const metadata: Metadata = {
  title: 'Sapo - Anonymous Messages',
  description: 'Share anonymous messages with your friends',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-400 to-yellow-400 px-4 py-8">
      <div className="mx-auto max-w-md">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/sapo.svg"
              alt="Sapo Logo"
              width={60}
              height={60}
              className="rounded-full"
              priority
            />
            <h1 className="text-2xl font-bold text-white">Sapo</h1>
          </div>
          <img src="/ibero-logo.png" alt="Ibero Logo" className="h-8" />
        </header>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white">
              <span className="text-red-500">Expose</span> your friends,
              <br />
              shitty Ex, bad teachers,
              <br />
              hot chicks, whatever.
            </h2>
            <MessageCount />
            <p className="text-xl text-red-500">Sapos de la Ibero</p>
          </div>

          <MessageInput />
          <MessageFeed />
          <PhoneVerification />
        </div>
      </div>
    </main>
  )
}

