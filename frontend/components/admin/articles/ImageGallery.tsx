import React, { useRef, useState } from 'react';
import { HiCloudUpload, HiTrash, HiStar, HiPlus, HiCheck, HiExclamationCircle } from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';
import { getImageUrl } from '@/utils/image';

interface ImageItem {
    local_id?: string;         // For stable referencing in Markdown
    image_url?: string;        // For existing images from server
    image_data?: string;       // For new images (base64)
    description?: string;
    is_primary?: boolean;
    file?: File;              // Keep file object reference
}

interface ImageGalleryProps {
    images: ImageItem[];
    onImagesChange: (images: ImageItem[]) => void;
    onImageInsert?: (url: string, description?: string, index?: number) => boolean;
    onImageRemove?: (image: ImageItem) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onImagesChange, onImageInsert, onImageRemove }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [processing, setProcessing] = React.useState(false);
    const [progress, setProgress] = React.useState({ current: 0, total: 0 });
    const [showInserted, setShowInserted] = useState(false);
    const [insertError, setInsertError] = useState(false);

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        setProcessing(true);
        setProgress({ current: 0, total: imageFiles.length });
        const currentImages = [...images];

        // Convert all files to base64
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            setProgress(prev => ({ ...prev, current: i + 1 }));
            try {
                const base64 = await convertFileToBase64(file);
                const newImage: ImageItem = {
                    local_id: `image-${Date.now()}-${i}`,
                    image_data: base64,
                    is_primary: currentImages.length === 0 && i === 0,
                    file: file,
                };
                currentImages.push(newImage);
            } catch (error) {
                console.error('Failed to process image', error);
            }
        }

        onImagesChange(currentImages);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        setProcessing(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        setProcessing(true);
        setProgress({ current: 0, total: imageFiles.length });
        const currentImages = [...images];

        // Convert all image files to base64
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            setProgress(prev => ({ ...prev, current: i + 1 }));
            try {
                const base64 = await convertFileToBase64(file);
                const newImage: ImageItem = {
                    local_id: `image-${Date.now()}-${i}`,
                    image_data: base64,
                    is_primary: currentImages.length === 0 && i === 0,
                    file: file,
                };
                currentImages.push(newImage);
            } catch (error) {
                console.error('Failed to process image', error);
            }
        }

        onImagesChange(currentImages);
        setProcessing(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleRemoveImage = (index: number) => {
        const removedImage = images[index];
        const newImages = images.filter((_, i) => i !== index);
        // If removed image was primary, make first image primary
        if (removedImage.is_primary && newImages.length > 0) {
            newImages[0].is_primary = true;
        }

        // Notify parent about removal for content cleanup
        if (onImageRemove) {
            onImageRemove(removedImage);
        }

        onImagesChange(newImages);
    };

    const handleSetPrimary = (index: number) => {
        const newImages = images.map((img, i) => ({
            ...img,
            is_primary: i === index,
        }));
        onImagesChange(newImages);
    };

    const handleDescriptionChange = (index: number, description: string) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], description };
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-3">
            {/* Upload Button with Drag and Drop */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 border-dashed transition-all cursor-pointer group ${isDragging
                    ? 'border-blue-500 bg-blue-100 scale-105'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
            >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    {processing ? (
                        <div className="flex flex-col items-center">
                            <FaSpinner className="animate-spin h-8 w-8 text-blue-500 mb-2" />
                            <div className="bg-blue-600 h-1.5 w-32 rounded-full overflow-hidden mb-1">
                                <div
                                    className="bg-blue-200 h-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <HiCloudUpload className={`w-10 h-10 transition-colors ${isDragging ? 'text-blue-500 scale-110' : 'text-gray-400 group-hover:text-blue-500'
                            }`} />
                    )}
                    <p className="mt-2 text-sm font-medium text-gray-600">
                        {processing
                            ? `Đang xử lý ảnh ${progress.current}/${progress.total}...`
                            : isDragging ? 'Thả ảnh vào đây' : 'Nhấn hoặc kéo thả ảnh vào đây'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 5MB - Tự động convert sang WebP</p>
                </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={processing}
            />

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {images
                        .map((img, originalIndex) => ({ img, originalIndex }))
                        .sort((a, b) => (a.img.is_primary === b.img.is_primary ? 0 : a.img.is_primary ? -1 : 1))
                        .map(({ img: image, originalIndex }, visualIndex) => {
                            const imageUrl = image.image_data || image.image_url || '';
                            // Use a more stable key than index: imageUrl or a fallback with index
                            const itemKey = `image-${imageUrl || originalIndex}`;

                            return (
                                <div
                                    key={itemKey}
                                    className="flex flex-col space-y-2 group"
                                >
                                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-400 transition-all shadow-sm">
                                        <img
                                            src={getImageUrl(imageUrl)}
                                            alt={`Image ${visualIndex + 1}`}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Primary Badge */}
                                        {image.is_primary && (
                                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1 shadow-md">
                                                <HiStar className="w-3 h-3" />
                                                <span>Chính</span>
                                            </div>
                                        )}

                                        {/* Order Badge (Visible) */}
                                        <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/20 flex items-center space-x-1 transition-all group-hover:bg-blue-500">
                                            <span>Ảnh {visualIndex + 1}</span>
                                            {image.image_data && <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>}
                                        </div>

                                        {/* Hover Actions */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                            {!image.is_primary && (
                                                <button
                                                    onClick={() => handleSetPrimary(originalIndex)}
                                                    className="bg-yellow-500 text-white p-2 rounded-full shadow-md hover:bg-yellow-600 transition-colors"
                                                    title="Đặt làm ảnh chính"
                                                >
                                                    <HiStar className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onImageInsert && (
                                                <button
                                                    onClick={() => {
                                                        const success = onImageInsert(image.local_id || imageUrl, image.description, visualIndex + 1);
                                                        if (success) {
                                                            setShowInserted(true);
                                                            setInsertError(false);
                                                            setTimeout(() => setShowInserted(false), 2000);
                                                        } else {
                                                            setInsertError(true);
                                                            setShowInserted(true); // Re-use the same container/logic
                                                            setTimeout(() => setShowInserted(false), 3000);
                                                        }
                                                    }}
                                                    className="bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                                                    title="Chèn vào nội dung"
                                                >
                                                    <HiPlus className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveImage(originalIndex)}
                                                className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                                title="Xóa ảnh"
                                            >
                                                <HiTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Description Input */}
                                    <input
                                        type="text"
                                        placeholder="Thêm mô tả ảnh..."
                                        value={image.description || ''}
                                        onChange={(e) => handleDescriptionChange(originalIndex, e.target.value)}
                                        className="text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white/80 transition-all font-medium placeholder:text-gray-400"
                                    />
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Global Toast Notification for Insertion */}
            <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ${showInserted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                {insertError ? (
                    <div className="bg-amber-900/90 backdrop-blur-md border border-amber-500/20 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                            <HiExclamationCircle className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-amber-400">Không thể chèn (Đang xem thử)</span>
                    </div>
                ) : (
                    <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <HiCheck className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-blue-400">Đã chèn ảnh</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGallery;
