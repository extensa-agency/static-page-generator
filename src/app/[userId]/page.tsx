'use client'
import { useRouter } from "next/navigation"
import { use, useEffect } from 'react'
import { useProjectLimits } from "@/hooks/useProjectLimits"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { useWebsites } from "@/hooks/useWebsites"
import WebsiteCard from "./components/WebsiteCard"

interface DashboardProps {
    params: Promise<{ userId: string }>;
}

export default function Dashboard({ params }: DashboardProps) {
    const router = useRouter()
    const resolvedParams = use(params)
    const { data: projectLimits } = useProjectLimits(resolvedParams.userId)
    const { data: websites } = useWebsites(resolvedParams.userId);
    useEffect(() => {
        const removeStaleDomainData = () => {
            localStorage.removeItem('domainSetupData')
        }
        removeStaleDomainData()
    }, [])
    const handleCreateNewProject = () => {
        if (!projectLimits?.canCreateMore) {
            toast.error("Project limit reached. Please upgrade your plan.")
            return
        }
        router.push('/questionnaire')
    }


    return (
        <div className="min-h-screen w-full bg-muted/40 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">My Projects</h1>
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-muted-foreground">
                                {projectLimits?.currentCount} / {projectLimits?.limit} projects used
                            </p>
                            <Button
                                onClick={handleCreateNewProject}
                                disabled={!projectLimits?.canCreateMore}
                            >
                                Create New Project
                            </Button>
                        </div>
                    </div>
                    {projectLimits && !projectLimits?.canCreateMore && (
                        <p className="mt-2 text-sm text-yellow-600">
                            You&apos;ve reached your project limit. Upgrade your plan to create more projects.
                        </p>
                    )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {websites?.map((project) => (
                        <WebsiteCard
                            key={project.id}
                            projectId={project.id}
                            userId={resolvedParams.userId}
                            project={project}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

