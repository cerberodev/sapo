import React, { useState } from 'react';
import Image from 'next/image';
import { X, Loader2 } from 'lucide-react';
import { UploadButton } from '@/utils/uploadthing';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon } from 'lucide-react';

const ImageUploadPreview = ({ onImageUpload, onImageRemove, isUploading, setIsUploading }: { onImageUpload: (url: string) => void, onImageRemove: () => void, isUploading: boolean, setIsUploading: (isUploading: boolean) => void }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    // const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleImageSelection = (file: File) => {
        // Create local preview immediately
        const localPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(localPreviewUrl);
        setIsUploading(true);
        setUploadProgress(0);
    };

    return (
        <div className="relative">
            {previewUrl ? (
                <div className="relative w-48 h-48 mt-4">
                    <Image
                        src={previewUrl}
                        alt="Preview"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                    />

                    {/* Loading Overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-white" />
                                <span className="text-white text-sm">{uploadProgress}%</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setPreviewUrl(null);
                            setIsUploading(false);
                            setUploadProgress(0);
                            onImageRemove();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    >
                        <X size={16} color="white" />
                    </button>
                </div>
            ) : (
                <UploadButton
                    endpoint="imageUploader"
                    onBeforeUploadBegin={(files) => {
                        handleImageSelection(files[0]);
                        setIsUploading(true);
                        return files;
                    }}
                    onUploadProgress={(progress) => {
                        setUploadProgress(Math.round(progress));
                    }}
                    onClientUploadComplete={(res) => {
                        if (res && res.length > 0) {
                            setIsUploading(false);
                            onImageUpload(res[0].url);
                            toast({
                                title: "Image uploaded successfully",
                                description: "Your image has been attached to the message.",
                            });
                        }
                    }}
                    onUploadError={(error) => {
                        setPreviewUrl(null);
                        setIsUploading(false);
                        toast({
                            title: "Error uploading image",
                            description: error.message,
                            variant: "destructive",
                        });
                    }}
                    appearance={{
                        button: "bg-transparent text-[#4AB84A] font-bold rounded-3xl py-0 h-8 w-10",
                        allowedContent: "hidden z-[-1]",
                        container: "absolute bottom-1 z-10",
                    }}
                    content={{
                        button: <button className="">
                            <ImageIcon
                                stroke="#000"
                                className="z-[-2] absolute top-0 left-0 translate-x-[50%] translate-y-[30%]"
                            />
                        </button>,
                    }}
                />
            )}
        </div>
    );
};

export default ImageUploadPreview;