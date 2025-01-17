import { Metadata } from 'next'
import { MessageFeed } from '@/components/message-feed'
import { MessageInput } from '@/components/message-input'
import { PhoneVerification } from '@/components/phone-verification'
import Image from 'next/image'
import { MessageCount } from '@/components/message-count'
import { ArrowDown } from 'lucide-react'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Sapo - Anonymous Messages',
  description: 'Share anonymous messages with your friends',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-md lg:max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="Sapo Logo"
              width={80}
              height={80}
              className="rounded-full"
              priority
            />
            <h1 className="text-2xl -mt-0.5 font-bold text-[#4CB648]">Sapo</h1>
            <h1 className="text-xs italic -mt-0.5 font-normal text-[#4CB648]">Pre-launch</h1>
          </div>
          <Image
            src="/ibero.png"
            alt="Ibero Logo"
            width={80}
            height={80}
            priority
          />
        </header>

        <div className="space-y-6 flex flex-col">
          <div className="text-center">
            <MessageCount />
            <p className="text-2xl font-semibold text-[#4CB648] bg-clip-text">Sapos de la Ibero</p>
          </div>

          <MessageInput />
          {/* <div className='w-4/5 h-0.5 bg-white bg-opacity-40 !my-12 mx-auto' /> */}
          <ArrowDown className='my-12 mx-auto animate-bounce' stroke='#fff' size={36} />
          <div className="space-y-6 relative">
            <Suspense>
              <MessageFeed />
            </Suspense>
            <div className="flex flex-col items-center justify-center w-20 absolute -bottom-20 left-[38%] lg:left-[44%] h-20 space-y-1">
              <div className='w-2 h-2 bg-white rounded-full' />
              <div className='w-2 h-2 bg-white rounded-full' />
              <div className='w-2 h-2 bg-white rounded-full' />
            </div>
          </div>
          <PhoneVerification />
        </div>
      </div>
    </main>
  )
}

