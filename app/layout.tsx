import { Metadata } from "next"
import './globals.css'
import { Inter } from 'next/font/google'
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { VerificationProvider } from "@/providers/VerifiedContext"
import { AnalyticsProvider } from "@/providers/AnalyticsProvider"

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Sapo - Anonymous Messages',
    description: 'Share anonymous messages exclusively to IBERO.',
}


export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-gradient-to-br from-green-400 to-yellow-400 min-h-screen">
                <div className="min-h-screen flex flex-col justify-between">
                    <main className={cn("flex-1", inter.className)}>
                        <AnalyticsProvider>
                            <VerificationProvider>
                                {children}
                            </VerificationProvider>
                        </AnalyticsProvider>
                    </main>
                    <Toaster />
                </div>
            </body>
        </html>
    )
}
