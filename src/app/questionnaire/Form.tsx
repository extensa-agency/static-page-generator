"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, X } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import ContactCard from "./components/ContactCard"
import colorPalettes from '@/data/color-palettes.json'
import ImageUpload from "./components/ImageUpload"
import Image from 'next/image';
import { useState, useEffect } from "react"
import { generateSiteId } from "../utils/siteId"
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { log } from "util"



// Define the form type
type WebsiteFormData = {
    basicInfo: {
        businessName: string
        tagline: string
        description: string
        branding: {
            logo_url: string | undefined
            default_logo_url?: string
            logo_file: {
                file: File | null
                name: string
                type: string
                size: number
                lastModified: number
                uploadedAt: string
            } | null
        }
    }
    offerings: {
        title: string
    }[]
    visualStyle: {
        colorPalette: string
        stylePreferences: string
        images: File[]
    }
    location: {
        address: string
        hours: {
            day: string
            open: string
            close: string
        }[]
    }
    contact: {
        method: "email" | "phone" | "form" | "subscribe"
        email?: string
        phone?: string
    }
}

// Define the validation schema
const formSchema = z.object({
    basicInfo: z.object({
        businessName: z.string().min(1, "Business name is required"),
        tagline: z.string().min(1, "Tagline is required"),
        description: z.string().min(1, "Description is required"),
        branding: z.object({
            logo_url: z.string().optional(),
            default_logo_url: z.string().optional(),
            logo_file: z.object({
                file: z.any().nullable(),
                name: z.string(),
                type: z.string(),
                size: z.number(),
                lastModified: z.number(),
                uploadedAt: z.string()
            }).nullable()
        }).refine((data) => data.logo_url || data.logo_file, {
            message: "Logo is required",
            path: ["logo"]
        })
    }),
    offerings: z.array(z.object({ title: z.string() })),
    visualStyle: z.object({
        colorPalette: z.string(),
        stylePreferences: z.string(),
        images: z.array(z.any())
    }),
    location: z.object({
        address: z.string(),
        hours: z.array(z.object({
            day: z.string(),
            open: z.string(),
            close: z.string()
        }))
    }),
    contact: z.object({
        method: z.enum(["email", "phone", "form", "subscribe"]),
        email: z.string().optional(),
        phone: z.string().optional()
    })
});

export default function WebsiteBuilderForm() {
    const [isClient, setIsClient] = useState(false);

    const { register, control, watch, setValue, handleSubmit, reset, formState: { errors } } = useForm<WebsiteFormData>({
        defaultValues: {
            basicInfo: {
                businessName: "",
                tagline: "",
                description: "",
                branding: {
                    logo_url: undefined,
                    logo_file: null
                }
            },
            offerings: [{ title: "" }],
            visualStyle: {
                colorPalette: "",
                stylePreferences: "",
                images: []
            },
            location: {
                address: "",
                hours: [
                    { day: "Monday", open: "9:00 AM", close: "5:00 PM" },
                    { day: "Tuesday", open: "9:00 AM", close: "5:00 PM" },
                    { day: "Wednesday", open: "9:00 AM", close: "5:00 PM" },
                    { day: "Thursday", open: "9:00 AM", close: "5:00 PM" },
                    { day: "Friday", open: "9:00 AM", close: "5:00 PM" },
                    { day: "Saturday", open: "9:00 AM", close: "5:00 PM" },
                    { day: "Sunday", open: "9:00 AM", close: "5:00 PM" },
                ]
            },
            contact: {
                method: "email"
            }
        },
        resolver: zodResolver(formSchema)
    });
    const [siteId] = useState(() => {
        return generateSiteId(watch("basicInfo.businessName") || 'site');
    });
    useEffect(() => {
        setIsClient(true);
        const savedData = localStorage.getItem('formData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Handle File objects specially since they can't be serialized
                if (parsedData.basicInfo?.branding?.logo_file?.file) {
                    parsedData.basicInfo.branding.logo_file.file = null;
                }
                if (parsedData.visualStyle?.images) {
                    parsedData.visualStyle.images = [];
                }

                // Ensure offerings array is properly handled
                if (parsedData.offerings && Array.isArray(parsedData.offerings)) {
                    // Reset with the complete offerings array
                    reset({
                        ...parsedData,
                        offerings: parsedData.offerings
                    });
                } else {
                    reset(parsedData);
                }
            } catch (error) {
                console.error('Error parsing saved form data:', error);
                localStorage.removeItem('formData');
            }
        }
    }, [reset]);

    // Optional: Add a function to clear saved data
    const clearSavedData = () => {
        localStorage.removeItem('formData');
        reset();
    };

    const { fields, append, remove } = useFieldArray({
        control,
        name: "offerings"
    })

    const colorOptions = colorPalettes.map((palette) => ({
        id: palette.name.toLowerCase(),
        name: palette.name,
        colors: [
            palette.roles.background,
            palette.roles.surface,
            palette.roles.text,
            palette.roles.textSecondary,
            palette.roles.primary,
            palette.roles.secondary,
            palette.roles.accent,
        ].filter(Boolean)
    }))

    const onSubmit = async (data: WebsiteFormData) => {
        try {
            // Create a copy of the form data to modify before saving
            const formDataToSave = JSON.parse(JSON.stringify(data));

            // Handle logo upload if there's a new file
            if (formDataToSave.basicInfo?.branding?.logo_file?.file) {
                const logoFileData = formDataToSave.basicInfo.branding.logo_file.file;
                // Skip upload if the file object doesn't have the proper structure
                if (!logoFileData.arrayBuffer) {
                    console.warn('Invalid file object, skipping upload');
                    formDataToSave.basicInfo.branding.logo_file = null;
                    return;
                }

                const logoFormData = new FormData();
                logoFormData.append('file', new File(
                    [logoFileData],
                    logoFileData.name || 'logo.png',
                    { type: logoFileData.type || 'image/png' }
                ));
                logoFormData.append('type', 'logo');
                logoFormData.append('siteId', siteId);

                const logoResponse = await fetch('/api/upload-asset', {
                    method: 'POST',
                    body: logoFormData,
                    headers: {
                        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
                    }
                });

                if (!logoResponse.ok) {
                    throw new Error('Logo upload failed');
                }

                const logoData = await logoResponse.json();
                formDataToSave.basicInfo.branding.logo_url = logoData.url;
                formDataToSave.basicInfo.branding.logo_file = null;
            }

            // Handle multiple images upload
            // if (formDataToSave.visualStyle?.images?.length > 0) {
            //     const imageUploadPromises = formDataToSave.visualStyle.images
            //         .filter(file => file && file.arrayBuffer) // Only process valid File objects
            //         .map(async (file: File) => {
            //             const imageFormData = new FormData();
            //             imageFormData.append('file', new File(
            //                 [file],
            //                 file.name || 'image.png',
            //                 { type: file.type || 'image/png' }
            //             ));
            //             imageFormData.append('type', 'image');
            //             imageFormData.append('siteId', siteId);

            //             const response = await fetch('/api/upload-asset', {
            //                 method: 'POST',
            //                 body: imageFormData,
            //                 headers: {
            //                     'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
            //                 }
            //             });

            //             if (!response.ok) {
            //                 throw new Error('Image upload failed');
            //             }

            //             const data = await response.json();
            //             return data.url;
            //         });

            //     const uploadedUrls = await Promise.all(imageUploadPromises);
            //     formDataToSave.visualStyle.images = uploadedUrls;
            // }

            // Save to localStorage
            localStorage.setItem('formData', JSON.stringify(formDataToSave));

            console.log('Form data saved:', formDataToSave);
            // Handle any other form submission logic here
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    }

    // Handle loading state
    if (!isClient) {
        return (
            <div className="container mx-auto py-8 max-w-4xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Website Builder</h1>

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-5 mb-8">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="offerings">Offerings</TabsTrigger>
                    <TabsTrigger value="visual">Visual Style</TabsTrigger>
                    <TabsTrigger value="location">Location & Hours</TabsTrigger>
                    <TabsTrigger value="contact">Contact Info</TabsTrigger>
                </TabsList>

                {/* Section 1: Basic Information */}
                <TabsContent value="basic" className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="businessName">Business Name *</Label>
                            <Input
                                id="businessName"
                                {...register("basicInfo.businessName")}
                                placeholder="Enter your business name"
                                className={errors.basicInfo?.businessName ? "border-red-500" : ""}
                            />
                            {errors.basicInfo?.businessName && (
                                <p className="text-sm text-red-500 mt-1">{errors.basicInfo.businessName.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="tagline">Tagline *</Label>
                            <Input
                                id="tagline"
                                {...register("basicInfo.tagline")}
                                placeholder="A short, catchy phrase"
                                className={errors.basicInfo?.tagline ? "border-red-500" : ""}
                            />
                            {errors.basicInfo?.tagline && (
                                <p className="text-sm text-red-500 mt-1">{errors.basicInfo.tagline.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                {...register("basicInfo.description")}
                                placeholder="Describe your business"
                                className={`min-h-[120px] ${errors.basicInfo?.description ? "border-red-500" : ""}`}
                            />
                            {errors.basicInfo?.description && (
                                <p className="text-sm text-red-500 mt-1">{errors.basicInfo.description.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="logo">Logo *</Label>
                            {errors.basicInfo?.branding && (
                                <p className="text-sm text-red-500 mt-1">{errors.basicInfo.branding.message}</p>
                            )}
                            {(watch("basicInfo.branding.logo_url") || watch("basicInfo.branding.logo_file")) ? (
                                <div className="my-4 p-4 border rounded-lg">
                                    <div className="relative w-full h-48">
                                        {(() => {
                                            const logoFile = watch("basicInfo.branding.logo_file")?.file;
                                            const logoSrc = logoFile instanceof File
                                                ? URL.createObjectURL(logoFile)
                                                : (watch("basicInfo.branding.logo_url") || null);

                                            if (!logoSrc) return null;

                                            return (
                                                <Image
                                                    src={logoSrc}
                                                    alt={watch("basicInfo.branding.logo_file") ? "Uploaded logo" : "Template logo"}
                                                    fill
                                                    style={{ objectFit: 'contain' }}
                                                    className="rounded-md"
                                                />
                                            );
                                        })()}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={() => {
                                                setValue("basicInfo.branding", {
                                                    logo_url: watch("basicInfo.branding.default_logo_url") || '',
                                                    logo_file: null
                                                });
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            {watch("basicInfo.branding.logo_file")
                                                ? `Custom logo: ${watch("basicInfo.branding.logo_file.name")}`
                                                : "Default template logo"}
                                        </p>
                                        {watch("basicInfo.branding.logo_file") && (
                                            <p className="text-xs text-gray-500">
                                                {Math.round(watch("basicInfo.branding.logo_file.size") / 1024)}KB
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <ImageUpload
                                    value={null}
                                    onChange={(file) => {
                                        if (file instanceof File) {
                                            setValue("basicInfo.branding", {
                                                ...watch("basicInfo.branding"),
                                                logo_file: {
                                                    file,
                                                    name: file.name,
                                                    type: file.type,
                                                    size: file.size,
                                                    lastModified: file.lastModified,
                                                    uploadedAt: new Date().toISOString()
                                                }
                                            });
                                        }
                                    }}
                                    type="logo"
                                    onUploadComplete={() => { }}
                                    siteId={siteId}
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Section 2: Offerings/Services */}
                <TabsContent value="offerings" className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Offerings/Services</h2>

                    <div className="space-y-4">
                        <Label>Offerings</Label>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Input
                                    {...register(`offerings.${index}.title`)}
                                    placeholder={`Offering ${index + 1}`}
                                />
                                {fields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ title: "" })}
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Another Offering
                        </Button>
                    </div>
                </TabsContent>

                {/* Section 3: Visual Style */}
                <TabsContent value="visual" className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Visual Style</h2>

                    <div className="space-y-4">
                        <div>
                            <Label>Color Palette</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                {colorOptions.map((option) => (
                                    <div key={option.id} className="border rounded-md p-3 cursor-pointer hover:border-primary">
                                        <div className="flex gap-1 mb-2">
                                            {option.colors.map((color, i) => (
                                                <div
                                                    key={i}
                                                    className="w-6 h-6 rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm">{option.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="style">Style Preferences</Label>
                            <Textarea
                                id="style"
                                {...register("visualStyle.stylePreferences")}
                                placeholder="Describe your preferred style (modern, classic, minimalist, etc.)"
                                className="min-h-[100px]"
                            />
                        </div>

                        <div>
                            <Label htmlFor="images">Images</Label>
                            <ImageUpload
                                value={null}
                                onChange={(file) => {
                                    if (file) {
                                        setValue("visualStyle.images", [...watch("visualStyle.images"), file])
                                    }
                                }}
                                multiple={true}
                                onMultipleFiles={(files) => {
                                    setValue("visualStyle.images", [...watch("visualStyle.images"), ...files])
                                }}
                                type="image"
                                onUploadComplete={() => { }}
                                siteId={siteId}
                            />

                            {/* Image previews would appear here */}
                            <div className="grid grid-cols-4 gap-2 mt-4">{/* Placeholder for image previews */}</div>
                        </div>
                    </div>
                </TabsContent>

                {/* Section 4: Location & Hours */}
                <TabsContent value="location" className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Location & Hours</h2>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                {...register("location.address")}
                                placeholder="Enter your business address"
                            />
                        </div>

                        <div>
                            <Label htmlFor="business-hours">Business Hours</Label>
                            <div className="space-y-2 mt-2">
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                    <div key={day} className="grid grid-cols-3 gap-2 items-center">
                                        <span className="text-sm">{day}</span>
                                        <Input
                                            {...register(`location.hours.${day.toLowerCase()}.open`)}
                                            placeholder="9:00 AM"
                                        />
                                        <Input
                                            {...register(`location.hours.${day.toLowerCase()}.close`)}
                                            placeholder="5:00 PM"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Section 5: Contact Information */}
                <TabsContent value="contact" className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

                    <div className="space-y-4">
                        <div>
                            <Label>Contact Methods</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {["email", "phone", "form", "subscribe"].map((method) => (
                                    <ContactCard
                                        key={method}
                                        type={method as "email" | "phone" | "form" | "subscribe"}
                                        selected={watch("contact.method") === method}
                                        onSelect={() => setValue("contact.method", method as any)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Contact Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("contact.email")}
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                {...register("contact.phone")}
                                placeholder="(123) 456-7890"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="mt-8 flex justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={clearSavedData}
                >
                    Reset Form
                </Button>
                <Button type="submit">Save & Continue</Button>
            </div>
        </form>
    )
}

