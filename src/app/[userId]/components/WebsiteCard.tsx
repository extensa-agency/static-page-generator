import { MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import Link from "next/link"
import { Website } from "@/hooks/useWebsites"

type Props = {
    projectId: string
    userId: string
    project: Website
}

export default function WebsiteCard(props: Props) {
    const router = useRouter()
    const { project } = props
    const queryClient = useQueryClient()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleDeleteProject(siteId: string) {
        try {
            setDeletingId(siteId)
            const response = await fetch('/api/delete-site', {
                method: 'POST',
                body: JSON.stringify({ siteId: siteId })
            })
            if (response.ok) {
                await queryClient.invalidateQueries({ queryKey: ["websites", props.userId] });
                await queryClient.invalidateQueries({ queryKey: ["projectLimits", props.userId] });
                toast.success('Project deleted successfully')
            } else {
                toast.error('Failed to delete project')
            }
        } finally {
            setDeletingId(null)
        }
    }
    const previewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/proxy?url=${encodeURIComponent(project.preview_url)}`
    return (
        <Card
            key={props.projectId}
            className="overflow-hidden"
        >
            <div className="aspect-video relative cursor-pointer"
                onClick={(e) => {
                    // Only navigate if the click target is the card or its non-dropdown children
                    if (!e.defaultPrevented) {
                        router.push(`/${props.userId}/edit/${project.site_id}`)
                    }
                }}>
                <Image
                    src={previewUrl || "/placeholder.svg"}
                    alt={project.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    priority
                />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col">
                    <CardTitle className="text-xl font-medium tracking-tight">{project.name}</CardTitle>
                    <span className="text-sm text-muted-foreground ml-auto">
                        Updated {new Date(project.updated_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                        })}
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Project</DropdownMenuItem>
                        <DropdownMenuItem>View Deployment</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-500"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteProject(project.site_id);
                            }}
                            disabled={deletingId === project.site_id}
                        >
                            {deletingId === project.site_id ? 'Deleting...' : 'Delete Project'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {project.hosting_status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </Badge>
                    {project.cloudfront_domain ? (
                        <Badge variant="secondary" className="rounded-full px-3 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 10V3L4 14H11V21L20 10H13Z" fill="currentColor" />
                            </svg>
                            CDN Connected
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="rounded-full px-3 text-muted-foreground border-muted">
                            <svg className="w-3 h-3 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 10V3L4 14H11V21L20 10H13Z" fill="currentColor" fillOpacity="0.5" />
                            </svg>
                            CDN Not Connected
                        </Badge>
                    )}
                    {project.domain_setups[0]?.completed ? (
                        <Badge variant="secondary" className="rounded-full px-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Domain Connected
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="rounded-full px-3 text-muted-foreground border-muted">
                            <svg className="w-3 h-3 mr-1 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Domain Not Connected
                        </Badge>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                    <Link href={project.project_url} target="_blank" rel="noopener noreferrer">
                        <Button>View Website</Button>
                    </Link>
                    {project.domain_setups[0]?.completed && (
                        <Link
                            href={`https://${project.domain_setups[0].domain_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline">Visit Domain</Button>
                        </Link>
                    )}
                </div>
                {!project.domain_setups[0]?.completed && (
                    <Link href={`/${props.userId}/edit/${project.site_id}/domain`} rel="noopener noreferrer">
                        <Button>Connect Domain</Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    )
}
