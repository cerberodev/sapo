'use client'

import { useState, useEffect } from 'react'
import { addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAnalytics } from '@/hooks/use-analytics'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { DynamicTheme } from '@/components/dynamic-theme'
import ImageUploadPreview from './image-previewer'
import ShakeButton from './shake-button'
import { CountdownTimer } from './countdown-timer'
import { useVerification } from '@/providers/VerifiedContext'

const CHARACTER_LIMIT = 200;

export function MessageInput() {
	const [message, setMessage] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [messageSent, setMessageSent] = useState(false)
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [sent, setSent] = useState(false)
	const { userId, setUserId } = useVerification()
	const { toast } = useToast()
	const { trackEvent } = useAnalytics()

	// Rate limiting
	const [lastMessageTime, setLastMessageTime] = useState<number>(0)
	const RATE_LIMIT_WINDOW = 3000 // 3 seconds
	const MAX_MESSAGES_PER_WINDOW = 2

	useEffect(() => {
		// Load last message time from localStorage
		const storedTime = localStorage.getItem('last_message_time')
		if (storedTime) {
			setLastMessageTime(parseInt(storedTime))
		}
	}, [])

	const handleSubmit = async () => {
		if (!message.trim() || message.length > CHARACTER_LIMIT) return

		setIsSubmitting(true)
		try {

			// Verificar rate limiting
			const now = Date.now()
			const messageCount = parseInt(localStorage.getItem('message_count') || '0')
			const timeElapsed = now - lastMessageTime

			if (timeElapsed < RATE_LIMIT_WINDOW && messageCount >= MAX_MESSAGES_PER_WINDOW) {
				const waitTime = Math.ceil((RATE_LIMIT_WINDOW - timeElapsed) / 1000)
				toast({
					title: "Espera un momento",
					description: `Puedes enviar otro mensaje en ${waitTime} segundos`,
					variant: "destructive",
				})
				return
			}

			// Update rate limiting data
			if (timeElapsed >= RATE_LIMIT_WINDOW) {
				localStorage.setItem('message_count', '1')
			} else {
				localStorage.setItem('message_count', (messageCount + 1).toString())
			}
			localStorage.setItem('last_message_time', now.toString())
			setLastMessageTime(now)

			let newUserId = userId
			if (!newUserId) {
				newUserId = crypto.randomUUID()
				localStorage.setItem('sapo_user_id', newUserId)
				setUserId(newUserId)
			}

			const messageDoc = await addDoc(collection(db, 'messages'), {
				content: message,
				userId: newUserId,
				createdAt: new Date().toISOString(),
				imageUrl: imageUrl,
			})

			const voteRef = doc(db, 'votes', `${userId}_${messageDoc.id}`)
			await setDoc(voteRef, {
				userId,
				messageId: messageDoc.id,
				voteType: 'upvote',
				timestamp: new Date()
			})

			// Track successful message submission
			trackEvent('message_submitted', {
				has_image: !!imageUrl,
				message_length: message.length,
			})

			setMessage('')
			setSent(true)
			setMessageSent(true)
			setImageUrl(null)
			toast({
				action: (
					<Image
						src='/check.svg'
						width={25}
						height={25}
						alt='check'
					/>
				),
				title: "¡Un sapo más!",
				duration: 3000,
				style: {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					flexDirection: 'column-reverse',
					gap: 2,
					borderRadius: '1rem',
				}
			})
		} catch (error: any) {
			console.error('Error sending message:', error)
			trackEvent('message_error', {
				error_type: error?.message || 'Unknown error'
			})
			toast({
				title: "Error sending message",
				description: "Please try again later.",
				variant: "destructive",
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSentButtonClick = () => {
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: 'smooth'
		});
	}

	return (
		<>
			<Card className="bg-transparent border-none shadow-none">
				<div className="flex items-center shadow-none justify-between p-2 px-3 bg-[#4CB648] rounded-t-xl rounded-b-none w-full">
					<DynamicTheme />
				</div>

				<div className="bg-[#F6F4F4] bg-opacity-20 shadow-xl rounded-b-xl rounded-t-none backdrop-blur-sm px-3 relative">
					<div className="flex flex-col">
						<Textarea
							placeholder="Envía mensajes anónimos a toda la Ibero"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className="bg-transparent border-none placeholder:text-[#827575] font-semibold text-sm !outline-none focus-visible:!outline-none !outline-transparent focus-visible:!outline-transparent focus:!ring-0 focus:!ring-transparent px-0 min-h-[8rem] shadow-none"
							maxLength={CHARACTER_LIMIT}
						/>

						<div className="flex justify-between items-end pb-2 mt-1">
							<ImageUploadPreview
								onImageUpload={(url: string) => {
									setImageUrl(url);
									setIsUploading(false);
								}}
								onImageRemove={() => {
									setImageUrl(null);
									setIsUploading(false);
								}}
								isUploading={isUploading}
								setIsUploading={setIsUploading}
								messageSent={messageSent}
								setMessageSent={setMessageSent}
							/>

							<div className="text-sm text-white">
								{message.length}/{CHARACTER_LIMIT}
							</div>
						</div>
					</div>
				</div>
			</Card>

			<div className="flex flex-col items-center justify-between !mt-2 gap-6">
				<div className="flex items-center gap-1 text-sm text-black font-bold">
					🔒
					<span>100% anónimo</span>
					🔒
				</div>
				{/* <CountdownTimer /> */}
				<ShakeButton
					onClick={handleSubmit}
					disabled={isSubmitting || isUploading}
					isSubmitting={isSubmitting}
				/>
				{sent && (
					<button className=' w-full bg-[#4AB84A] text-white font-bold rounded-3xl py-0 h-8 
                    disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400
                    transition-transform hover:scale-105 active:scale-95' onClick={handleSentButtonClick}>
						Join Waiting List
					</button>
				)}
			</div>
		</>
	)
}
