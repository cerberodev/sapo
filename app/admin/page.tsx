'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  createdAt: string
  userId: string
}

interface Stats {
  totalMessages: number
  totalVisitors: number
  avgMessagesPerUser: number
  totalShares: number
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ totalMessages: 0, totalVisitors: 0, avgMessagesPerUser: 0, totalShares: 0 })
  const [messages, setMessages] = useState<Message[]>([])
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setLoading(false)
        fetchData()
      } else {
        router.push('/admin/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchData = async () => {
    // Fetch messages
    const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', sortOrder))
    const messagesSnapshot = await getDocs(messagesQuery)
    const fetchedMessages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      content: doc.data().content,
      createdAt: doc.data().createdAt,
      userId: doc.data().userId
    }))
    setMessages(fetchedMessages)

    // Fetch shares
    const sharesQuery = query(collection(db, 'shares'))
    const sharesSnapshot = await getDocs(sharesQuery)
    const totalShares = sharesSnapshot.size

    // Calculate stats
    const uniqueUsers = new Set(fetchedMessages.map(message => message.userId))
    const totalMessages = fetchedMessages.length
    const totalVisitors = uniqueUsers.size
    const avgMessagesPerUser = totalVisitors > 0 ? totalMessages / totalVisitors : 0

    setStats({
      totalMessages,
      totalVisitors,
      avgMessagesPerUser,
      totalShares
    })
  }

  useEffect(() => {
    if (!loading) {
      fetchData()
    }
  }, [loading, sortOrder])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/admin/login')
  }

  const StatCard = ({ title, value }: { title: string, value: number | string }) => (
    <Card className="flex flex-col items-center justify-center p-1 h-24 gap-2">
      <CardHeader className="text-center !p-0">
        <CardTitle className="text-base font-medium text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className='!p-0'>
        <p className="text-4xl font-bold" style={{ color: '#5FBF54' }}>{value}</p>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Welcome to the admin dashboard. Here you can view stats and manage messages.</p>
          <Button onClick={handleLogout}>Logout</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Messages" value={stats.totalMessages} />
        <StatCard title="Total Visitors" value={stats.totalVisitors} />
        <StatCard title="Avg. Messages/User" value={stats.avgMessagesPerUser.toFixed(2)} />
        <StatCard title="Total Shares" value={stats.totalShares} />
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <Select defaultValue="desc" onValueChange={(value: any) => setSortOrder(value as 'desc' | 'asc')}>
            <SelectTrigger className="w-[180px] outline-none focus-visible:outline-none focus-visible:ring-0 border-b border-b-black rounded-none border-x-0 border-t-0">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Most Recent</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="p-4">
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
      </div>
    </div>
  )
}

