'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface MessageStats {
    day: number;
    count: number;
}

interface DayTheme {
    day: number;
    theme: string;
}

interface Message {
    id: string;
    createdAt: string;
}

export function DayManagement() {
    const [themes, setThemes] = useState<DayTheme[]>(Array.from({ length: 6 }, (_, i) => ({
        day: i + 1,
        theme: ''
    })));
    const [stats, setStats] = useState<MessageStats[]>(Array.from({ length: 6 }, (_, i) => ({
        day: i + 1,
        count: 0
    })));
    const [loading, setLoading] = useState(true);
    const [currentDay, setCurrentDay] = useState(1);
    const { toast } = useToast();

    // Fetch existing themes
    useEffect(() => {
        const fetchThemes = async () => {
            const themeData: DayTheme[] = [];
            for (let i = 1; i <= 6; i++) {
                const docRef = doc(db, 'dayThemes', `day${i}`);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    const defaultTheme = `Day ${i}: Change this theme`;
                    await setDoc(docRef, {
                        theme: defaultTheme,
                        day: i,
                        createdAt: new Date().toISOString()
                    });
                    themeData.push({
                        day: i,
                        theme: defaultTheme
                    });
                } else {
                    themeData.push({
                        day: i,
                        theme: docSnap.data().theme
                    });
                }
            }
            setThemes(themeData);
        };

        fetchThemes();
    }, []);

    const getCurrentDay = () => {
        const now = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
        const mexicoTime = new Date(now);
        const hours = mexicoTime.getHours();
        const currentDayOfWeek = mexicoTime.getDay();

        if (hours < 18) {
            if (currentDayOfWeek === 0) return 6;
            return currentDayOfWeek;
        } else {
            if (currentDayOfWeek === 6) return 1;
            return currentDayOfWeek + 1;
        }
    };

    const getMessageDay = (messageDate: Date) => {
        const mexicoTime = new Date(messageDate.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const hours = mexicoTime.getHours();
        const messageDayOfWeek = mexicoTime.getDay();

        if (hours < 18) {
            if (messageDayOfWeek === 0) return 6;
            return messageDayOfWeek;
        } else {
            if (messageDayOfWeek === 6) return 1;
            return messageDayOfWeek + 1;
        }
    };

    const handleThemeUpdate = async (day: number, newTheme: string) => {
        try {
            const docRef = doc(db, 'dayThemes', `day${day}`);
            await setDoc(docRef, {
                theme: newTheme,
                day: day,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            setThemes(prev => prev.map(t =>
                t.day === day ? { ...t, theme: newTheme } : t
            ));

            toast({
                title: "Theme Updated",
                description: `Theme for Day ${day} has been updated successfully.`
            });
        } catch (error) {
            console.error('Error updating theme:', error);
            toast({
                title: "Error",
                description: "Failed to update theme. Please try again.",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        const fetchMessageStats = async () => {
            try {
                const messagesRef = collection(db, 'messages');
                const messagesSnap = await getDocs(messagesRef);
                const messages = messagesSnap.docs.map(doc => ({
                    id: doc.id,
                    createdAt: doc.data().createdAt,
                })) as Message[];

                const statsData = Array.from({ length: 6 }, (_, i) => ({
                    day: i + 1,
                    count: 0
                }));

                messages.forEach(msg => {
                    const messageDate = new Date(msg.createdAt);
                    const dayNumber = getMessageDay(messageDate);

                    if (dayNumber >= 1 && dayNumber <= 6) {
                        statsData[dayNumber - 1].count++;
                        console.log(`Message counted in Day ${dayNumber}`, {
                            messageTime: messageDate.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }),
                            dayNumber
                        });
                    }
                });

                setStats(statsData);
                setCurrentDay(getCurrentDay());
                setLoading(false);
            } catch (error) {
                console.error('Error fetching message stats:', error);
                toast({
                    title: "Error",
                    description: "Failed to load message statistics",
                    variant: "destructive"
                });
            }
        };

        fetchMessageStats();

        const interval = setInterval(() => {
            setCurrentDay(getCurrentDay());
        }, 60000);

        return () => clearInterval(interval);
    }, [toast]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Day Themes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {themes.map((theme) => (
                            <div key={theme.day} className="flex gap-4 items-center">
                                <p className="font-medium min-w-[80px]">
                                    Day {theme.day}
                                    {currentDay === theme.day && (
                                        <span className="text-xs">
                                            {" "}(Current)
                                        </span>
                                    )}
                                </p>
                                <Input
                                    value={theme.theme}
                                    onChange={(e) => {
                                        setThemes(prev => prev.map(t =>
                                            t.day === theme.day ? { ...t, theme: e.target.value } : t
                                        ));
                                    }}
                                    placeholder={`Enter theme for Day ${theme.day}`}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => handleThemeUpdate(theme.day, theme.theme)}
                                    variant="outline"
                                >
                                    Save
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Messages per Day</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats}>
                                <XAxis
                                    dataKey="day"
                                    label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                    label={{ value: 'Messages', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value) => [`${value} messages`, 'Count']}
                                    labelFormatter={(day) => `Day ${day}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#4AB84A"
                                    strokeWidth={2}
                                    dot={{ fill: '#4AB84A' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}