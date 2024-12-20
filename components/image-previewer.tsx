import React, { useState } from 'react';
import Image from 'next/image';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { UploadButton } from '@/utils/uploadthing';
import { useToast } from '@/hooks/use-toast';

const ImageUploadPreview = ({
    onImageUpload,
    onImageRemove,
    isUploading,
    setIsUploading
}: {
    onImageUpload: (url: string) => void;
    onImageRemove: () => void;
    isUploading: boolean;
    setIsUploading: (value: boolean) => void;
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();

    const handleImageSelection = (file: File) => {
        const localPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(localPreviewUrl);
        setIsUploading(true);
        setUploadProgress(0);
    };

    return (
        <div className="flex items-center">
            {previewUrl ? (
                <div className="relative w-48 h-48">
                    <Image
                        src={previewUrl}
                        alt="Preview"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                    />

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
                        button: "bg-transparent hover:bg-transparent p-0",
                        allowedContent: "hidden",
                        container: "relative",
                    }}
                    content={{
                        button:
                            <ImageIcon
                                size={24}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            />
                    }}
                />
            )}
        </div>
    );
};

export default ImageUploadPreview;