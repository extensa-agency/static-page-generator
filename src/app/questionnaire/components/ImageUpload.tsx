/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    description?: string;
    onDescriptionChange?: (description: string) => void;
    multiple?: boolean;
    onMultipleFiles?: (files: File[]) => void;
    hidePreview?: boolean;
    type: 'image' | 'logo';
    onUploadComplete: () => void;
    siteId: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    description = '',
    onDescriptionChange,
    multiple = false,
    onMultipleFiles,
    hidePreview = false,
    type,
    onUploadComplete,
    siteId,
}) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (multiple && onMultipleFiles) {
            onMultipleFiles(acceptedFiles);
        } else if (acceptedFiles.length > 0) {
            onChange(acceptedFiles[0]);
        }
        onUploadComplete();
    }, [onChange, multiple, onMultipleFiles, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        },
        maxSize: 5242880, // 5MB
        multiple
    });

    const removeImage = () => {
        onChange(null);
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    ${value && !hidePreview ? 'border-green-500 bg-green-50' : ''}`}
            >
                <input {...getInputProps()} />
                {value && !hidePreview ? (
                    <div className="relative w-full h-48">
                        <Image
                            src={URL.createObjectURL(value)}
                            alt="Selected image"
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeImage();
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 py-4">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="text-sm text-gray-600">
                            {isDragActive ? (
                                "Drop the image(s) here"
                            ) : (
                                <div>
                                    <p>Drag & drop image{multiple ? 's' : ''} here, or click to select</p>
                                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {onDescriptionChange && (
                <input
                    type="text"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Image description"
                    className="w-full p-2 border rounded-md"
                />
            )}
        </div>
    );
};

export default ImageUpload; 