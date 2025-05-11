'use client'
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CompletePageProps {
  userId: string;
  projectId: string;
}

export default function CompletePage({ userId, projectId }: CompletePageProps) {
  const [domainName, setDomainName] = useState<string | null>(null);
  const [distributionDomain, setDistributionDomain] = useState<string | null>(null);
  const [nameservers, setNameservers] = useState<string[]>([]);
  const [dnsSetupOption, setDnsSetupOption] = useState<"nameservers" | "alias">("nameservers");
  const router = useRouter();

  useEffect(() => {
    const setupData = localStorage.getItem('domainSetupData');
    if (!setupData) {
      router.push(`/${userId}/edit/${projectId}/domain/input`);
      return;
    }

    const { domainName, distributionDomain, nameservers, dnsSetupOption } = JSON.parse(setupData);
    setDomainName(domainName);
    setDistributionDomain(distributionDomain);
    setNameservers(nameservers || []);
    setDnsSetupOption(dnsSetupOption || "nameservers");
  }, [userId, projectId, router]);

  if (!domainName || !distributionDomain) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <CardTitle>Setup Complete</CardTitle>
          </div>
          <CardDescription>
            Your domain setup is complete! Follow these final steps to make your site accessible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your domain {domainName} has been successfully connected to your site.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="font-semibold">Next Steps</h4>
            {dnsSetupOption === "nameservers" ? (
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Update your domain registrar&apos;s nameservers to:</li>
                <div className="ml-6 space-y-1">
                  {nameservers.map((ns, index) => (
                    <code key={index} className="block font-mono bg-muted p-2 rounded-md">
                      {ns}
                    </code>
                  ))}
                </div>
                <li>Wait for DNS changes to propagate (can take up to 48 hours)</li>
                <li>Your site will be accessible at:</li>
                <div className="ml-6 space-y-1">
                  <code className="block font-mono bg-muted p-2 rounded-md">
                    https://{domainName}
                  </code>
                  <code className="block font-mono bg-muted p-2 rounded-md">
                    https://www.{domainName}
                  </code>
                </div>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>If your DNS provider doesn&apos;t support ALIAS records, use your domain registrars redirect feature.</li>
                <li>Wait for DNS changes to propagate <strong>(can take up to 48 hours)</strong></li>
                <li>Your site will be accessible at:</li>
                <div className="ml-6 space-y-1">
                  <code className="block font-mono bg-muted p-2 rounded-md">
                    https://{domainName}
                  </code>
                  <code className="block font-mono bg-muted p-2 rounded-md">
                    https://www.{domainName}
                  </code>
                </div>
              </ol>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 