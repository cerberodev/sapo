'use client'

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function DynamicTheme() {
    const [theme, setTheme] = useState('');
    const [currentDay, setCurrentDay] = useState(1);

    useEffect(() => {
        // Calculate current day based on Mexico time (UTC-6)
        const calculateCurrentDay = () => {
            const startDate = new Date('2024-03-20T18:00:00-06:00'); // Day 1 start (6 PM Mexico time)
            const now = new Date();
            const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

            // Calculate days difference
            const diffTime = mexicoTime.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Adjust day if it's before 6 PM
            const hours = mexicoTime.getHours();
            const currentDay = hours < 18 ? diffDays + 1 : diffDays + 2;

            return Math.min(Math.max(currentDay, 1), 6); // Keep between 1 and 6
        };

        const dayNumber = calculateCurrentDay();
        setCurrentDay(dayNumber);

        const themeDoc = doc(db, 'dayThemes', `day${dayNumber}`);
        const unsubscribe = onSnapshot(themeDoc, (doc) => {
            if (doc.exists()) {
                setTheme(doc.data().theme);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <p className='font-semibold'>
            {theme || `Expose lo más Whitexican de la Ibero`}
        </p>
    );
}