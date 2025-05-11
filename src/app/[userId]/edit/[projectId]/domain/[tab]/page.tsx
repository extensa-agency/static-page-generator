import InputPage from "@/app/[userId]/edit/[projectId]/domain/components/Input";
import ValidationForm from "@/app/[userId]/edit/[projectId]/domain/components/ValidationForm";
import DNSForm from "@/app/[userId]/edit/[projectId]/domain/components/DNS";
import { use } from "react"
import CompletePage from "../components/CompletePage";


interface PageProps {
  params: Promise<{
    userId: string;
    projectId: string;
    tab: string;
  }>;
}
export default function page({ params }: PageProps) {
  const { tab, userId, projectId } = use(params)

  switch (tab) {
    case "input":
      return <InputPage userId={userId} projectId={projectId} />
    case "validation":
      return <ValidationForm userId={userId} projectId={projectId} />
    case "dns":
      return <DNSForm userId={userId} projectId={projectId} />
    case "complete":
      return <CompletePage userId={userId} projectId={projectId} />

  }
}
