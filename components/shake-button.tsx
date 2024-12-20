import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const ShakeButton = ({ onClick, disabled, isSubmitting }: { onClick: () => void, disabled: boolean, isSubmitting: boolean }) => {
    const [animationsLeft, setAnimationsLeft] = useState(3);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (animationsLeft > 0 && !disabled && !isSubmitting) {
            const timeoutId = setTimeout(() => {
                setIsShaking(true);
                setAnimationsLeft(prev => prev - 1);

                // Reset shake after animation completes
                setTimeout(() => {
                    setIsShaking(false);
                }, 800);
            }, 1000); // Wait 1 second between each set of shakes

            return () => clearTimeout(timeoutId);
        }
    }, [animationsLeft, disabled, isSubmitting, isShaking]);

    return (
        <div className="w-full">
            <Button
                onClick={onClick}
                disabled={disabled}
                className={`
                    w-full bg-white text-[#4AB84A] font-bold rounded-3xl py-0 h-8 
                    disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400
                    transition-transform hover:scale-105 active:scale-95
                    ${isShaking ? 'animate-shake' : ''}
                `}
            >
                {isSubmitting ? 'Sending...' : 'Sapo'}
            </Button>
        </div>
    );
};

export default ShakeButton;