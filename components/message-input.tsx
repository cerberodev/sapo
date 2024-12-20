'use client'

import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { DynamicTheme } from '@/components/dynamic-theme'
import ImageUploadPreview from './image-previewer'
import ShakeButton from './shake-button'
import { CountdownTimer } from './countdown-timer'

const CHARACTER_LIMIT = 200;

export function MessageInput() {
	const [message, setMessage] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const { toast } = useToast()

	const handleSubmit = async () => {
		if (!message.trim() || message.length > CHARACTER_LIMIT) return

		setIsSubmitting(true)
		try {
			let userId = localStorage.getItem('sapo_user_id')
			if (!userId) {
				userId = crypto.randomUUID()
				localStorage.setItem('sapo_user_id', userId)
			}

			await addDoc(collection(db, 'messages'), {
				content: message,
				userId,
				createdAt: new Date().toISOString(),
				imageUrl: imageUrl,
			})

			setMessage('')
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
		} catch (error) {
			console.error('Error sending message:', error)
			toast({
				title: "Error sending message",
				description: "Please try again later.",
				variant: "destructive",
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<Card className="bg-transparent border-none relative shadow-none">
				<div className="flex items-center shadow-none justify-between p-2 px-3 bg-white rounded-t-xl rounded-b-none w-full">
					<DynamicTheme />
				</div>

				<Textarea
					placeholder="Envía mensajes anónimos a toda la Ibero"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					className="bg-white bg-opacity-20 shadow-xl rounded-b-xl rounded-t-none backdrop-blur-sm px-3 border-none placeholder:text-[#827575] font-semibold text-sm !outline-none focus-visible:!outline-none !outline-transparent focus-visible:!outline-transparent focus:!ring-0 focus:!ring-transparent"
					rows={8}
					maxLength={CHARACTER_LIMIT}
				/>
				<div className="w-full flex justify-between items-center bg-transparent shadow-none">
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
					/>
				</div>
				<div className="text-right absolute text-sm text-white mt-1 right-0">
					{message.length}/{CHARACTER_LIMIT}
				</div>
			</Card>
			<div className="flex flex-col items-center justify-between !mt-2 gap-6">
				<div className="flex items-center gap-1 text-sm text-white font-bold">
					🔒
					<span>100% anónimo</span>
					🔒
				</div>
				<CountdownTimer />
				<ShakeButton
					onClick={handleSubmit}
					disabled={isSubmitting || isUploading}
					isSubmitting={isSubmitting}
				/>
			</div>
		</>
	)
}