'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, orderBy, getDocs, doc, getDoc, where, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import Image from 'next/image'
import { Download, Search, X } from 'lucide-react'
import { DayManagement } from '@/components/day-management'
import { Switch } from "@/components/ui/switch"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

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
  isSelected?: boolean
  displayOrder?: number
}

interface WaitlistEntry {
  id: string
  phoneNumber: string
  countryCode: string
  countryName: string
  timestamp: string
  rawPhone: string
  userId?: string
}

interface Stats {
  totalMessages: number
  totalVisitors: number
  avgMessagesPerUser: number
  totalShares: number
}

interface UserStats {
  userId: string
  messageCount: number
  phoneNumber?: string
  countryName?: string
  lastActive?: string
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
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [userSortOrder, setUserSortOrder] = useState<'desc' | 'asc'>('desc')
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null)
  const [userMessages, setUserMessages] = useState<Message[]>([])
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [clearDataOpen, setClearDataOpen] = useState(false)
  const [startingCount, setStartingCount] = useState(0)
  const [feedMode, setFeedMode] = useState<'auto' | 'manual'>('auto')
  const { toast } = useToast()
  const router = useRouter()

  const handleClearData = async () => {
    const sharesQuery = collection(db, 'shares')
    const sharesData = await getDocs(sharesQuery)

    await Promise.all(
      [
        Promise.all(sharesData.docs.map(async (share) => {
          await deleteDoc(doc(db, 'shares', share.id))
        })),
        Promise.all(messages.map(async (message) => {
          await deleteDoc(doc(db, 'messages', message.id))
        })),
        Promise.all(waitlist.map(async (waitlist) => {
          await deleteDoc(doc(db, 'waitlist', waitlist.id))
        })),
      ]
    )
    toast({
      title: "Data Cleared",
      description: "All data has been cleared successfully."
    });
  }
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

  const handleFeedModeChange = async (mode: 'auto' | 'manual') => {
    try {
      const settingsRef = doc(db, 'settings', 'feedMode')
      await setDoc(settingsRef, { id: 'feedMode', mode }, { merge: true })
      setFeedMode(mode)
      toast({
        title: "Feed Mode Updated",
        description: `Feed mode has been set to ${mode}.`
      })
    } catch (error) {
      console.error('Error updating feed mode:', error)
      toast({
        title: "Error",
        description: "Failed to update feed mode.",
        variant: "destructive"
      })
    }
  }

  const handleMessageSelection = async (messageId: string, isSelected: boolean) => {
    try {
      const messageRef = doc(db, 'messages', messageId)

      if (isSelected) {
        // Count currently selected messages
        const selectedMessagesQuery = query(
          collection(db, 'messages'),
          where('isSelected', '==', true)
        )
        const selectedSnapshot = await getDocs(selectedMessagesQuery)

        if (selectedSnapshot.size >= 20 && isSelected) {
          toast({
            title: "Limit Reached",
            description: "You can only select up to 20 messages.",
            variant: "destructive"
          })
          return
        }

        // Get the highest current order
        const highestOrderMessage = selectedSnapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id }))
          .reduce((max, msg) =>
            ((msg as Message)?.displayOrder || 0) > (max || 0) ? ((msg as Message).displayOrder || 0) : max
            , 0)

        // Set new message as last in order
        setMessages(messages.map(message =>
          message.id === messageId
            ? { ...message, isSelected, displayOrder: (highestOrderMessage || 0) + 1 }
            : message
        ))

        await updateDoc(messageRef, {
          isSelected,
          displayOrder: (highestOrderMessage || 0) + 1
        })
      } else {
        // If unselecting, remove order and update other messages' orders
        const oldMessage = messages.find(m => m.id === messageId)
        const oldOrder = oldMessage?.displayOrder || 0

        // Update orders of all messages after this one
        const updatePromises = messages
          .filter(m => m.isSelected && m.displayOrder && m.displayOrder > oldOrder)
          .map(m => {
            const newOrder = (m.displayOrder || 0) - 1
            return updateDoc(doc(db, 'messages', m.id), { displayOrder: newOrder })
          })

        setMessages(messages.map(message => {
          if (message.id === messageId) {
            return { ...message, isSelected: false, displayOrder: undefined }
          }
          if (message.displayOrder && message.displayOrder > oldOrder) {
            return { ...message, displayOrder: message.displayOrder - 1 }
          }
          return message
        }))

        await Promise.all([
          updateDoc(messageRef, {
            isSelected: false,
            displayOrder: null
          }),
          ...updatePromises
        ])
      }

      toast({
        title: isSelected ? "Message Selected" : "Message Unselected",
        description: isSelected ? "Message added to feed" : "Message removed from feed"
      })
    } catch (error) {
      console.error('Error updating message selection:', error)
      toast({
        title: "Error",
        description: "Failed to update message selection.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setLoading(false)
        fetchData()
        // Fetch feed mode
        const getFeedMode = async () => {
          const settingsDoc = await getDoc(doc(db, 'settings', 'feedMode'))
          if (settingsDoc.exists()) {
            setFeedMode(settingsDoc.data().mode)
          }
        }
        getFeedMode()
      } else {
        router.push('/admin/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleUserClick = async (user: UserStats) => {
    // Filter messages for the selected user
    const userMessages = messages.filter(message => message.userId === user.userId)
    setUserMessages(userMessages)
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

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

    const userStatsMap = new Map<string, UserStats>()

    const countQuery = doc(db, 'count', 'imZopcsjVcKLYGCwPE9T')
    const countSnapshot = await getDoc(countQuery)

    const startingCount = countSnapshot.data()?.count || 0
    setStartingCount(startingCount)

    // Process messages to count per user
    fetchedMessages.forEach(message => {
      if (!message.userId) return

      const stats = userStatsMap.get(message.userId) || {
        userId: message.userId,
        messageCount: 0,
        lastActive: message.createdAt
      }

      stats.messageCount++
      if (new Date(message.createdAt) > new Date(stats.lastActive!)) {
        stats.lastActive = message.createdAt
      }

      userStatsMap.set(message.userId, stats)
    })

    // Add phone numbers from waitlist
    fetchedWaitlist.forEach(entry => {
      if (!entry.userId) return

      const stats = userStatsMap.get(entry.userId)
      if (stats) {
        stats.phoneNumber = entry.phoneNumber
        stats.countryName = entry.countryName
      }
    })

    setUserStats(Array.from(userStatsMap.values()))

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

  const sortedAndFilteredUsers = userStats
    .filter(user =>
      (userSearch.toLowerCase() ? user.userId.toLowerCase().includes(userSearch.toLowerCase()) : true) ||
      (userSearch.toLowerCase() ? (user.phoneNumber?.toLowerCase().includes(userSearch.toLowerCase()) ?? false) : true)
    )
    .sort((a, b) => {
      const order = userSortOrder === 'desc' ? -1 : 1
      return (a.messageCount - b.messageCount) * order
    })

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

  const moveMessage = async (messageId: string, direction: 'up' | 'down') => {
    try {
      const currentMessage = messages.find(m => m.id === messageId)
      if (!currentMessage?.displayOrder) return

      const currentOrder = currentMessage.displayOrder
      const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1

      const otherMessage = messages.find(m => m.displayOrder === newOrder && m.isSelected)
      if (!otherMessage) return

      // Update both messages
      await Promise.all([
        updateDoc(doc(db, 'messages', messageId), {
          displayOrder: newOrder
        }),
        updateDoc(doc(db, 'messages', otherMessage.id), {
          displayOrder: currentOrder
        })
      ])

      // Update local state
      setMessages(messages.map(message => {
        if (message.id === messageId) {
          return { ...message, displayOrder: newOrder }
        }
        if (message.id === otherMessage.id) {
          return { ...message, displayOrder: currentOrder }
        }
        return message
      }))

    } catch (error) {
      console.error('Error reordering messages:', error)
      toast({
        title: "Error",
        description: "Failed to reorder messages.",
        variant: "destructive"
      })
    }
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

  const handleExport = () => {
    let csvContent = '';

    if (activeTab === 'messages') {
      // Headers for messages
      csvContent = 'Content,User ID,Created At,Image URL,Day,Phone Number\n';

      // Create a map of user message counts and phone numbers
      const userInfo = new Map();
      messages.forEach(msg => {
        const info = userInfo.get(msg.userId) || { messageCount: 0, phone: '' };
        info.messageCount++;
        userInfo.set(msg.userId, info);
      });

      // Add phone numbers from waitlist
      waitlist.forEach(entry => {
        if (entry.userId) {
          const info = userInfo.get(entry.userId) || { messageCount: 0, phone: '' };
          info.phone = entry.phoneNumber;
          userInfo.set(entry.userId, info);
        }
      });

      // Data rows for messages
      const messageRows = filteredMessages.map((message: Message) => {
        const content = message.content.replace(/"/g, '""'); // Escape quotes in content
        const messageDay = getMessageDay(new Date(message.createdAt));
        const userInfoData = userInfo.get(message.userId) || { messageCount: 0, phone: '' };

        return `"${content}",${message.userId},${message.createdAt},${message.imageUrl || ''},Day ${messageDay},${userInfoData.phone || ''}`
      }).join('\n');

      csvContent += messageRows;
    } else if (activeTab === 'users') {
      // Headers for users export
      csvContent = 'User ID,Total Messages,Phone Number,Country,Last Active\n';

      // Create user statistics
      const userStats = new Map();
      messages.forEach(msg => {
        const stats = userStats.get(msg.userId) || {
          messageCount: 0,
          phone: '',
          country: '',
          lastActive: msg.createdAt
        };
        stats.messageCount++;
        if (new Date(msg.createdAt) > new Date(stats.lastActive)) {
          stats.lastActive = msg.createdAt;
        }
        userStats.set(msg.userId, stats);
      });

      // Add phone numbers from waitlist
      waitlist.forEach(entry => {
        if (entry.userId) {
          const stats = userStats.get(entry.userId);
          if (stats) {
            stats.phone = entry.phoneNumber;
            stats.country = entry.countryName;
          }
        }
      });

      // Create rows for users export
      const userRows = Array.from(userStats.entries()).map(([userId, stats]) => {
        return `${userId},${stats.messageCount},${stats.phone || ''},${stats.country || ''},${stats.lastActive}`
      }).join('\n');

      csvContent += userRows;
    } else {
      // Headers for waitlist (unchanged)
      csvContent = 'Phone Number,Country Name,Country Code,Raw Phone,Timestamp\n';

      // Data rows for waitlist (unchanged)
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
    URL.revokeObjectURL(url);
  };

  const UserMessagesModal = () => {
    if (!selectedUser) return null

    return (
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Messages from {selectedUser.phoneNumber || selectedUser.userId}</span>
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUserModalOpen(false)}
                className="h-6 w-6 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button> */}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {userMessages.map((message) => (
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
            {userMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No messages found for this user
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleStartingCountUpdate = async () => {
    try {
      const countDoc = doc(db, 'count', 'imZopcsjVcKLYGCwPE9T')
      await setDoc(countDoc, {
        count: startingCount
      }, { merge: true })

      toast({
        title: "Count Updated",
        description: `Count has been updated successfully.`
      });
    } catch (error) {
      console.error('Error updating count:', error);
      toast({
        title: "Error",
        description: "Failed to update count. Please try again.",
        variant: "destructive"
      });
    }
  }

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
          <Button variant='destructive' onClick={() => setClearDataOpen(true)} className='ml-2'>Clear Data</Button>
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

      <div className='mb-8'>
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Starting Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex gap-4 items-center">
                  <p className="font-medium min-w-[80px]">
                    Starting Count
                  </p>
                  <Input
                    value={startingCount}
                    onChange={(e) => {
                      setStartingCount(e.target.value ? parseInt(e.target.value) : 0)
                    }}
                    placeholder={`Enter Starting Count`}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleStartingCountUpdate}
                    variant="outline"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Feed Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Feed Mode</p>
              <p className="text-sm text-gray-500">
                Choose between automatic (most recent 20) or manually selected messages
              </p>
            </div>
            <Select value={feedMode} onValueChange={handleFeedModeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select feed mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic</SelectItem>
                <SelectItem value="manual">Manual Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="messages" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 max-lg:flex-col-reverse">
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2 max-md:max-w-40"
            >
              <Download className="h-4 w-4" />
              Export {activeTab === 'messages' ? 'Messages' : activeTab === 'Waitlist' ? 'Waitlist' : 'Users'}
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
                {feedMode === 'manual' && (
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveMessage(message.id, 'up')}
                        disabled={!message.isSelected || message.displayOrder === 1}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveMessage(message.id, 'down')}
                        disabled={!message.isSelected || message.displayOrder === 20}
                      >
                        ↓
                      </Button>
                    </div>
                    <Switch
                      checked={message.isSelected}
                      onCheckedChange={(checked) => handleMessageSelection(message.id, checked)}
                    />
                    {message.isSelected && (
                      <span className="text-sm text-gray-500">
                        {message.displayOrder}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {message.isSelected ? 'Selected' : 'Not Selected'}
                    </span>
                  </div>
                )}
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

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              defaultValue="desc"
              onValueChange={(value: any) => setUserSortOrder(value as 'desc' | 'asc')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Most Messages</SelectItem>
                <SelectItem value="asc">Least Messages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sortedAndFilteredUsers.map((user) => (
            <Card
              key={user.userId}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleUserClick(user)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">User ID: {user.userId}</p>
                  {user.phoneNumber && (
                    <div className="text-xs text-gray-500">
                      <p>{user.phoneNumber}</p>
                      <p>{user.countryName}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{user.messageCount}</p>
                  <p className="text-xs text-gray-500">messages</p>
                  {user.lastActive && (
                    <p className="text-xs text-gray-500">
                      Last active: {new Date(user.lastActive).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {sortedAndFilteredUsers.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No users found matching your search
            </div>
          )}
        </TabsContent>
      </Tabs>
      <UserMessagesModal />
      <Dialog open={clearDataOpen} onOpenChange={setClearDataOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to clear all data?</p>
            <div className="flex justify-end">
              <Button onClick={handleClearData} variant="destructive">Clear Data</Button>
              <Button onClick={() => setClearDataOpen(false)} className="ml-2">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}