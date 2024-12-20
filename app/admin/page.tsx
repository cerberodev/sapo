'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import Image from 'next/image'
import { Download, Search } from 'lucide-react'
import { DayManagement } from '@/components/day-management'
import { Check } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const dayOptions = [
  { value: "1", label: "Day 1" },
  { value: "2", label: "Day 2" },
  { value: "3", label: "Day 3" },
  { value: "4", label: "Day 4" },
  { value: "5", label: "Day 5" },
  { value: "6", label: "Day 6" }
];

interface Message {
  id: string
  content: string
  createdAt: string
  userId: string
  imageUrl?: string
}

interface WaitlistEntry {
  id: string
  phoneNumber: string
  countryCode: string
  countryName: string
  timestamp: string
  rawPhone: string
}

interface Stats {
  totalMessages: number
  totalVisitors: number
  avgMessagesPerUser: number
  totalShares: number
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    totalVisitors: 0,
    avgMessagesPerUser: 0,
    totalShares: 0
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [activeTab, setActiveTab] = useState('messages')
  const [messageSearch, setMessageSearch] = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const router = useRouter()

  const getMessageDay = (messageDate: Date) => {
    const mexicoTime = new Date(messageDate.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    const hours = mexicoTime.getHours();
    const messageDayOfWeek = mexicoTime.getDay();

    if (hours < 18) {
      if (messageDayOfWeek === 0) return "6";
      return messageDayOfWeek.toString();
    } else {
      if (messageDayOfWeek === 6) return "1";
      return (messageDayOfWeek + 1).toString();
    }
  };

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
      ...doc.data()
    })) as Message[]
    setMessages(fetchedMessages)

    // Fetch waitlist
    const waitlistQuery = query(collection(db, 'waitlist'), orderBy('timestamp', sortOrder))
    const waitlistSnapshot = await getDocs(waitlistQuery)
    const fetchedWaitlist = waitlistSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaitlistEntry[]
    setWaitlist(fetchedWaitlist)

    // Fetch shares and calculate stats
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

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(messageSearch.toLowerCase());
    if (selectedDays.length === 0) return matchesSearch;

    const messageDay = getMessageDay(new Date(message.createdAt));
    return matchesSearch && selectedDays.includes(messageDay);
  });

  const filteredWaitlist = waitlist.filter(entry =>
    entry.phoneNumber.toLowerCase().includes(phoneSearch.toLowerCase()) ||
    entry.countryName.toLowerCase().includes(phoneSearch.toLowerCase()) ||
    entry.rawPhone.toLowerCase().includes(phoneSearch.toLowerCase()) ||
    entry.countryCode.toLowerCase().includes(phoneSearch.toLowerCase())
  )

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

  const handleExport = () => {
    let csvContent = '';

    if (activeTab === 'messages') {
      // Headers for messages
      csvContent = 'Content,User ID,Created At,Image URL\n';

      // Data rows for messages
      const messageRows = filteredMessages.map((message: Message) => {
        const content = message.content.replace(/"/g, '""'); // Escape quotes in content
        return `"${content}",${message.userId},${message.createdAt},${message.imageUrl || ''}`
      }).join('\n');

      csvContent += messageRows;
    } else {
      // Headers for waitlist
      csvContent = 'Phone Number,Country Name,Country Code,Raw Phone,Timestamp\n';

      // Data rows for waitlist
      const waitlistRows = filteredWaitlist.map((entry: WaitlistEntry) => {
        const countryName = entry.countryName.replace(/,/g, ';'); // Replace commas in country names
        return `${entry.phoneNumber},"${countryName}",${entry.countryCode},${entry.rawPhone},${entry.timestamp}`
      }).join('\n');

      csvContent += waitlistRows;
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL
  };

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

      <div className="mb-8">
        <DayManagement />
      </div>

      <Tabs defaultValue="messages" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 max-lg:flex-col-reverse">
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2 max-md:max-w-40"
            >
              <Download className="h-4 w-4" />
              Export {activeTab === 'messages' ? 'Messages' : 'Waitlist'}
            </Button>
            {activeTab === 'messages' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-dashed max-md:max-w-40">
                    <span className="max-md:text-xs">
                      {selectedDays && selectedDays.length > 0
                        ? `${selectedDays.length} days selected`
                        : "Filter by day"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Suggestions">
                        {dayOptions.map((day) => (
                          <CommandItem
                            key={day.value}
                            onSelect={() => {
                              setSelectedDays(prev => {
                                const current = Array.isArray(prev) ? prev : [];
                                if (current.includes(day.value)) {
                                  return current.filter(value => value !== day.value);
                                }
                                return [...current, day.value];
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                (selectedDays || []).includes(day.value) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {day.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            <div className="relative flex-1 max-w-sm max-md:max-w-40">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'messages' ? 'Search messages...' : 'Search phone numbers...'}
                value={activeTab === 'messages' ? messageSearch : phoneSearch}
                onChange={(e) => {
                  if (activeTab === 'messages') {
                    setMessageSearch(e.target.value)
                  } else {
                    setPhoneSearch(e.target.value)
                  }
                }}
                className="pl-9 max-md:text-xs"
              />
            </div>
          </div>


          <Select defaultValue="desc" onValueChange={(value: any) => setSortOrder(value as 'desc' | 'asc')}>
            <SelectTrigger className="w-[180px] max-md:mb-auto outline-none focus-visible:outline-none focus-visible:ring-0 border-b border-b-black rounded-none border-x-0 border-t-0">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Most Recent</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="messages" className="space-y-4">
          {filteredMessages.map((message) => (
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
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  {message.imageUrl && (
                    <div className="mt-2">
                      <Image
                        src={message.imageUrl}
                        alt="Attached image"
                        width={200}
                        height={200}
                        className="rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          {filteredWaitlist.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{entry.phoneNumber}</p>
                  <div className="text-xs text-gray-500">
                    <span>{entry.countryName}</span>
                    <span className="mx-2">•</span>
                    <span>{entry.countryCode}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            </Card>
          ))}
          {filteredWaitlist.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No phone numbers found matching your search
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}