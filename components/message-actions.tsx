import { ArrowBigUp, ArrowBigDown, Share2, ArrowUpCircle, ArrowDownCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, doc, setDoc, query, where, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useVerification } from '@/providers/VerifiedContext'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
    messageId: string
    initialVotes: number
    initialShares: number
}

interface VoteData {
    userId: string
    messageId: string
    voteType: 'upvote' | 'downvote'
}

interface ShareData {
    userId: string
    messageId: string
    timestamp: Date
}

export function MessageActions({ messageId, initialVotes, initialShares }: MessageActionsProps) {
    const { userId } = useVerification()
    const [totalVotes, setTotalVotes] = useState(initialVotes)
    const [shareCount, setShareCount] = useState(initialShares)
    const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)

    const { toast } = useToast()

    useEffect(() => {
        if (!userId) return

        // Listen for votes on this message
        const votesRef = collection(db, 'votes')
        const messageVotesQuery = query(votesRef, where('messageId', '==', messageId))

        // Listen for user's specific vote
        const userVoteQuery = query(
            votesRef,
            where('userId', '==', userId),
            where('messageId', '==', messageId)
        )

        // Listen for shares
        const sharesRef = collection(db, 'shares')
        const messageSharesQuery = query(sharesRef, where('messageId', '==', messageId))

        // Subscribe to total votes
        const votesUnsubscribe = onSnapshot(messageVotesQuery, (snapshot) => {
            let upvotes = 0
            let downvotes = 0

            snapshot.forEach(doc => {
                const vote = doc.data() as VoteData
                if (vote.voteType === 'upvote') upvotes++
                else if (vote.voteType === 'downvote') downvotes--
            })

            setTotalVotes(initialVotes + upvotes + downvotes)
        })

        // Subscribe to user's vote
        const userVoteUnsubscribe = onSnapshot(userVoteQuery, (snapshot) => {
            if (!snapshot.empty) {
                const voteData = snapshot.docs[0].data() as VoteData
                setUserVote(voteData.voteType)
            } else {
                setUserVote(null)
            }
        })

        // Subscribe to shares
        const sharesUnsubscribe = onSnapshot(messageSharesQuery, (snapshot) => {
            setShareCount(initialShares + snapshot.size)
        })

        return () => {
            votesUnsubscribe()
            userVoteUnsubscribe()
            sharesUnsubscribe()
        }
    }, [userId, messageId, initialVotes, initialShares])

    const handleVote = async (voteType: 'upvote' | 'downvote') => {
        if (!userId) return

        const voteRef = doc(db, 'votes', `${userId}_${messageId}`)

        if (userVote === voteType) {
            await deleteDoc(voteRef)
        } else {
            // Set new vote
            await setDoc(voteRef, {
                userId,
                messageId,
                voteType,
                timestamp: new Date()
            })
        }
    }

    const handleShare = async () => {
        if (!userId) return

        try {
            // Create the share URL (adjust the base URL according to your deployment)
            const shareUrl = `${window.location.origin}/?message=${messageId}`

            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl)

            // Create share record in Firestore
            const shareRef = doc(db, 'shares', `${userId}_${messageId}_${Date.now()}`)
            await setDoc(shareRef, {
                userId,
                messageId,
                timestamp: new Date()
            })

            // Show success toast
            toast({
                title: "¡Enlace copiado!",
                description: "El enlace del mensaje ha sido copiado al portapapeles",
                duration: 3000
            })
        } catch (error) {
            // Show error toast if something goes wrong
            toast({
                title: "Error al compartir",
                description: "No se pudo copiar el enlace. Por favor, intenta de nuevo.",
                variant: "destructive",
                duration: 3000
            })
        }
    }

    return (
        <div className="flex justify-between items-center pt-3 w-full">
            <button
                onClick={handleShare}
                className="text-gray-500 hover:text-gray-700 transition-colors"
            >
                <div className="flex items-center gap-1">
                    <Image src='/share.svg' width={24} height={24} alt='share' />
                    <span className="text-sm text-[#5B5F62]">{shareCount}</span>
                </div>
            </button>

            <div className="flex items-center gap-3 w-[83px]">
                <button
                    onClick={() => handleVote('upvote')}
                    className={`transition-colors p-1 border-2 border-[#29322C] rounded-full ${userVote === 'upvote' ? 'border-[#45A33D] bg-[#45A33D]' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ArrowUp strokeWidth={2.5} stroke={userVote === 'upvote' ? '#fff' : '#29322C'} className="h-3.5 w-3.5" />
                </button>

                <span className={cn("text-sm font-medium", totalVotes < 0 ? 'text-[#ED1515]' : userVote === 'upvote' ? 'text-[#45A33D]' : userVote === 'downvote' ? 'text-[#ED1515]' : 'text-gray-500')}>{totalVotes}</span>

                <button
                    onClick={() => handleVote('downvote')}
                    className={`transition-colors p-1 border-2 border-[#29322C] rounded-full ${userVote === 'downvote' ? 'border-[#ED1515] bg-[#ED1515]' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ArrowDown strokeWidth={2.5} stroke={userVote === 'downvote' ? '#fff' : '#29322C'} className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}