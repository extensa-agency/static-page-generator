'use client'
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { Breadcrumbs } from '@/components/breadcrumbs';

interface DomainLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        userId: string;
        projectId: string;
    }>;
}

const steps = [
    { name: "Input", path: "input", icon: "📝" },
    { name: "Validation", path: "validation", icon: "✓" },
    // { name: "Distribution", path: "distribution", icon: "🌐" },
    { name: "DNS", path: "dns", icon: "🔗" },
    { name: "Complete", path: "complete", icon: "🎉" },
];

export default function DomainLayout({ children, params }: DomainLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { userId, projectId } = use(params);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        // Find current step index based on pathname
        const stepIndex = steps.findIndex(step =>
            pathname.includes(`/domain/${step.path}`)
        );
        setCurrentStep(stepIndex !== -1 ? stepIndex : 0);

        // Load progress from localStorage
        const setupData = localStorage.getItem('domainSetupData');
        if (setupData) {
            const data = JSON.parse(setupData);
            const completed: number[] = [];

            // Determine completed steps based on stored data
            if (data.domainName) completed.push(0);
            if (data.validationRecords) completed.push(1);
            if (data.certificateArn) completed.push(1);
            if (data.distributionDomain) completed.push(2);
            if (data.nameservers || data.dnsSetupOption) completed.push(3);

            setCompletedSteps(completed);
        }
    }, [pathname]);

    const handleStepClick = (index: number) => {
        // Only allow navigation to completed steps or the next available step
        if (completedSteps.includes(index) || index === Math.min(completedSteps.length, steps.length - 1)) {
            router.push(`/${userId}/edit/${projectId}/domain/${steps[index].path}`);
        }
    };

    return (
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    { label: "Projects", href: `/${userId}` },
                    { label: "Edit Project", href: `/${userId}/edit/${projectId}` },
                    { label: "Domain Setup", href: `/${userId}/edit/${projectId}/domain/input` },
                    ...(currentStep >= 0 ? steps.slice(0, currentStep + 1).map((step, idx, arr) => ({
                        label: step.name,
                        href: idx !== arr.length - 1 ? `/${userId}/edit/${projectId}/domain/${step.path}` : undefined,
                        isActive: idx === arr.length - 1
                    })) : [])
                ]}
            />

            {/* Progress Steps */}
            <div className="relative mt-12">
                <div className="absolute top-[2.25rem] left-0 right-0 h-1 -translate-y-1/2">
                    <div className="absolute left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-in-out"
                        style={{
                            width: `${(currentStep) / (steps.length - 1) * 100}%`,
                            zIndex: 1,
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                        }}
                    />
                    <div className="absolute left-0 right-0 h-full bg-gray-200 dark:bg-gray-700" style={{ zIndex: 0 }} />
                </div>
                <div className="flex items-center justify-between w-full relative">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = completedSteps.includes(index);
                        const isClickable = completedSteps.includes(index) || index === Math.min(completedSteps.length, steps.length - 1);
                        const isLast = index === steps.length - 1;

                        return (
                            <div
                                key={step.path}
                                className={cn(
                                    "flex flex-col items-center relative group cursor-pointer",
                                    !isClickable && "cursor-not-allowed opacity-50"
                                )}
                                onClick={() => isClickable && handleStepClick(index)}
                            >
                                <div
                                    className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center z-10 text-lg transition-all duration-300 transform",
                                        "border-4 shadow-lg",
                                        isActive && "bg-gradient-to-r from-blue-500 to-purple-500 border-white scale-110",
                                        isCompleted && "bg-gradient-to-r from-green-400 to-blue-500 border-white",
                                        !isActive && !isCompleted && "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700",
                                        isClickable && "hover:scale-110",
                                    )}
                                    style={{
                                        boxShadow: isActive || isCompleted ? '0 0 20px rgba(59, 130, 246, 0.3)' : ''
                                    }}
                                >
                                    {isCompleted ? (
                                        <Check className="w-8 h-8 text-white animate-bounce" />
                                    ) : (
                                        <span className={cn(
                                            "text-2xl transition-all duration-300",
                                            isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                                        )}>
                                            {step.icon}
                                        </span>
                                    )}
                                </div>
                                <span className={cn(
                                    "mt-4 text-sm font-medium transition-all duration-300",
                                    "absolute -bottom-8 whitespace-nowrap",
                                    isActive && "text-blue-600 dark:text-blue-400 font-bold scale-105",
                                    isCompleted && "text-green-600 dark:text-green-400",
                                    !isActive && !isCompleted && "text-gray-500 dark:text-gray-400"
                                )}>
                                    {step.name}
                                </span>
                                {!isLast && (
                                    <div className="absolute top-8 left-[4rem] w-[calc(100%-4rem)] h-1" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="mt-8">
                {children}
            </div>
        </div>
    );
} 