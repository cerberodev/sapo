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
      <div className="mx-auto max-w-md lg:max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex flex-col items-center">
            <Image
              src="/sapo.svg"
              alt="Sapo Logo"
              width={80}
              height={80}
              className="rounded-full"
              priority
            />
            <h1 className="text-lg -mt-2 font-bold text-white">Sapo</h1>
          </div>
          <Image
            src="/ibero.svg"
            alt="Ibero Logo"
            width={80}
            height={80}
            priority
          />
        </header>

        <div className="space-y-6 flex flex-col">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              <span className="bg-gradient-to-r from-[#CD3656] to-[#FF6E76] text-transparent bg-clip-text">Expose</span> your friends,
              <br />
              shitty Ex, bad teachers,
              <br />
              hot chicks, whatever.
            </h2>
            <MessageCount />
            <p className="text-xl bg-gradient-to-r from-[#CD3656] to-[#FF6E76] text-transparent bg-clip-text">Sapos de la Ibero</p>
          </div>

          <MessageInput />
          <div className='w-4/5 h-0.5 bg-white bg-opacity-40 !my-12 mx-auto' />
          <div className="space-y-6 relative">
            <MessageFeed />
            <div className="flex flex-col items-center justify-center w-20 absolute -bottom-20 left-[38%] lg:left-[43%] h-20 space-y-1">
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

