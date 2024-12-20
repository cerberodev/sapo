import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
    endValue: number;
    duration: number;
}

export default function AnimatedNumber({ endValue = 100, duration = 1000 }: AnimatedNumberProps) {
    const [count, setCount] = useState(0);
    const startTimestampRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const step = (timestamp: number) => {
            if (!startTimestampRef.current) startTimestampRef.current = timestamp;
            const progress = timestamp - startTimestampRef.current;

            const percentage = Math.min(progress / duration, 1);
            const currentCount = Math.floor(percentage * endValue);

            setCount(currentCount);

            if (progress < duration) {
                animationFrameRef.current = window.requestAnimationFrame(step);
            } else {
                setCount(endValue);
            }
        };

        animationFrameRef.current = window.requestAnimationFrame(step);

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
            startTimestampRef.current = null;
        };
    }, [endValue, duration]);

    return (
        <p className="mt-4 text-3xl font-semibold text-red-500">{count.toString()}</p>
    );
};

