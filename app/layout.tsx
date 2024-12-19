import { Metadata } from "next"
import './globals.css'

export const metadata: Metadata = {
    title: 'Sapo - Anonymous Messages',
    description: 'Share anonymous messages with your friends',
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
                    <main className="flex-1 p-4">{children}</main>
                </div>
            </body>
        </html>
    )
}