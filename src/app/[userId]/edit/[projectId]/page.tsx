'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebsites } from '@/hooks/useWebsites';
import { use } from 'react';
import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels"
import { GripVertical, Globe, Settings, Trash2, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface PageProps {
    params: Promise<{
        userId: string;
        projectId: string;
    }>;
}
export default function ProjectEditPage({ params }: PageProps) {
    const { projectId, userId } = use(params)
    const { data: websites, isLoading, error } = useWebsites(userId);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const queryClient = useQueryClient()
    async function handleDeleteProject(siteId: string) {
        try {
            setDeletingId(siteId)
            const response = await fetch('/api/delete-site', {
                method: 'POST',
                body: JSON.stringify({ siteId: siteId })
            })
            if (response.ok) {
                await queryClient.invalidateQueries({ queryKey: ["websites", userId] });
                await queryClient.invalidateQueries({ queryKey: ["projectLimits", userId] });
                toast.success('Project deleted successfully')
            } else {
                toast.error('Failed to delete project')
            }
        } finally {
            setDeletingId(null)
        }
    }
    if (isLoading) return (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" /> {/* Title skeleton */}

            <PanelGroup
                direction="horizontal"
                className="min-h-[calc(100vh-200px)]"
            >
                {/* Preview Panel Skeleton */}
                <Panel
                    defaultSize={75}
                    minSize={50}
                    maxSize={90}
                >
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" /> {/* Card title skeleton */}
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <div className="h-full w-full bg-gray-200 rounded-lg animate-pulse" />
                        </CardContent>
                    </Card>
                </Panel>

                <PanelResizeHandle>
                    <GripVertical className="h-4 w-4" />
                </PanelResizeHandle>

                {/* Chat Panel Skeleton */}
                <Panel
                    defaultSize={25}
                    minSize={10}
                    maxSize={50}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /> {/* Chat title skeleton */}
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>
                </Panel>
            </PanelGroup>
        </div>
    );

    if (error) return <div>Error loading website</div>;

    const website = websites?.find((website) => website.site_id === projectId);
    if (!website) return <div>Website not found</div>;


    return (
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs
                items={[
                    { label: "Projects", href: `/${userId}` },
                    { label: "Edit Project", isActive: true }
                ]}
                className="mb-4"
            />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit Project</h1>
                <div className="flex items-center gap-2">
                    {website.domain_setups[0]?.completed && (
                        <>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <HelpCircle className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="w-80 p-4">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Domain Setup Status</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Your domain has been successfully connected! Here's what's happening:
                                            </p>
                                            <ul className="text-sm space-y-1 list-disc list-inside">
                                                <li>DNS changes are propagating (can take up to 48 hours)</li>
                                                <li>SSL certificate is active and secure</li>
                                                <li>CloudFront distribution is configured</li>
                                            </ul>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                If you can't access your site yet, please wait for DNS propagation to complete.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Badge variant="secondary" className="rounded-full px-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Domain Connected
                            </Badge>
                        </>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Website Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {!website.domain_setups[0]?.completed ? (
                                <DropdownMenuItem asChild>
                                    <Link href={`/${userId}/edit/${projectId}/domain`}>
                                        <Globe className="h-4 w-4 mr-2" />
                                        Connect Domain
                                    </Link>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem asChild>
                                    <Link href={`https://${website.domain_setups[0].domain_name}`} target="_blank" rel="noopener noreferrer">
                                        <Globe className="h-4 w-4 mr-2" />
                                        Visit Website
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                        Delete Website
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Website</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to delete this website? This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                        <Button disabled={deletingId === projectId} variant="destructive" onClick={() => handleDeleteProject(projectId)}>{deletingId === projectId ? "Deleting..." : "Delete"}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <PanelGroup
                direction="horizontal"
                className="min-h-[calc(100vh-200px)]"
            >
                {/* Preview Panel */}
                <Panel
                    defaultSize={75}
                    minSize={50}
                    maxSize={90}
                >
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Site Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <div className="h-full w-full border rounded-lg overflow-hidden">
                                <iframe
                                    src={website.cloudfront_domain
                                        ? `https://${website.cloudfront_domain}`
                                        : `${process.env.NEXT_PUBLIC_SITE_URL}/api/proxy?url=${encodeURIComponent(website.project_url)}`}
                                    className="w-full h-full"
                                    title="Website Preview"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </Panel>

                {/* Resize Handle */}
                {/* <PanelResizeHandle>
                    <GripVertical className="h-4 w-4" />
                </PanelResizeHandle> */}

                {/* Chat Panel */}
                {/* <Panel
                    defaultSize={25}
                    minSize={10}
                    maxSize={50}
                    collapsible={true}
                    collapsedSize={5}
                    onCollapse={() => setIsChatMinimized(true)}
                    onExpand={() => setIsChatMinimized(false)}
                >
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={isChatMinimized ? "hidden" : ""}>AI Chat</CardTitle>
                        </CardHeader>
                        <CardContent className={isChatMinimized ? "hidden" : ""}>
                            <div className="flex flex-col h-[calc(100vh-300px)]">
                                <div className="flex-1 overflow-y-auto mb-4">
                                    
                                </div>
                                <div className="border-t pt-4">

                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Panel> */}
            </PanelGroup>
        </div>
    )
} 
