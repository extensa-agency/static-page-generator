'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { InsertDomainSetup } from "@/app/services/db";

interface DNSPageProps {
  userId: string;
  projectId: string;
}

export default function DNSForm({ userId, projectId }: DNSPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [distributionDomain, setDistributionDomain] = useState<string | null>(null);
  const [dnsSetupOption, setDnsSetupOption] = useState<"nameservers" | "alias">("alias");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const setupData = localStorage.getItem('domainSetupData');
    if (!setupData) {
      router.push(`/${userId}/edit/${projectId}/domain/input`);
      return;
    }

    const { domainName } = JSON.parse(setupData);
    setDomainName(domainName);

    // Get distributionDomain from URL query parameter
    const distributionDomainFromUrl = searchParams.get('distributionDomain');
    if (distributionDomainFromUrl) {
      setDistributionDomain(distributionDomainFromUrl);
    } else {
      const { distributionDomain } = JSON.parse(setupData);
      setDistributionDomain(distributionDomain);
    }
  }, [userId, projectId, router, searchParams]);

  const handleSetupDNS = async () => {
    setIsLoading(true);
    try {
      const setupData = JSON.parse(localStorage.getItem('domainSetupData') || '{}');
      let nameservers = [];

      if (dnsSetupOption === "nameservers") {
        const response = await fetch("/api/cloudfront/dns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domainName,
            distributionDomain,
            setupOption: dnsSetupOption,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to setup DNS records");
        }

        const data = await response.json();
        nameservers = data.nameservers || [];

        // Update the stored data with nameservers information
        localStorage.setItem('domainSetupData', JSON.stringify({
          ...setupData,
          nameservers,
          dnsSetupOption
        }));
      } else {
        // For ALIAS setup, just save the option to localStorage
        localStorage.setItem('domainSetupData', JSON.stringify({
          ...setupData,
          dnsSetupOption
        }));
      }

      // Insert the domain setup data into the database using the server function
      if (!domainName || !distributionDomain) {
        throw new Error("Domain name and distribution domain are required");
      }

      await InsertDomainSetup({
        domainName,
        certificateArn: setupData.certificateArn,
        distributionDomain,
        dnsSetupOption,
        nameservers,
        validationRecords: setupData.validationRecords,
        siteId: projectId
      });

      router.push(`/${userId}/edit/${projectId}/domain/complete`);
    } catch (err: any) {
      setError(err.message || "Failed to setup DNS records");
    } finally {
      setIsLoading(false);
    }
  };

  if (!domainName || !distributionDomain) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <CardTitle>Connect Your Domain</CardTitle>
          </div>
          <CardDescription>
            Choose the easiest way to connect your domain to your website. We recommend Option 1 for most users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="alias"
                  name="dnsSetup"
                  value="alias"
                  checked={dnsSetupOption === "alias"}
                  onChange={() => setDnsSetupOption("alias")}
                  className="h-4 w-4"
                />
                <label htmlFor="alias" className="text-sm font-medium">
                  Option 1: ALIAS Record Setup (Recommended)
                </label>
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  This is the easiest and fastest option using ALIAS records. You&apos;ll need to:
                </p>
                <ol className="list-decimal pl-6 text-sm text-muted-foreground space-y-2">
                  <li>Log in to your domain provider (like GoDaddy, Namecheap, etc.)</li>
                  <li>Find the DNS settings or domain management section</li>
                  <li>Look for &quot;ALIAS&quot; or &quot;ANAME&quot; records and add these settings:</li>
                </ol>
                <div className="bg-muted p-4 rounded-md space-y-2 mt-2">
                  <div className="grid text-sm grid-cols-[minmax(4rem,auto)_minmax(5rem,auto)_1fr_minmax(4rem,auto)] font-medium">
                    <div>Type</div>
                    <div>Host</div>
                    <div>Points to</div>
                    <div>TTL</div>
                  </div>
                  <div className="grid text-sm grid-cols-[minmax(4rem,auto)_minmax(5rem,auto)_1fr_minmax(4rem,auto)] items-center">
                    <div>ALIAS</div>
                    <div>@</div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(distributionDomain || "");
                          toast.success("Copied to clipboard");
                        }}
                        aria-label="Copy Points to value"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75M15.75 6v12a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h7.5A2.25 2.25 0 0115.75 6z" />
                        </svg>
                      </Button>
                      <Input
                        value={distributionDomain}
                        readOnly
                        className="font-mono text-xs bg-background border rounded px-2 py-1 min-w-0 overflow-x-auto"
                        style={{ minWidth: 0 }}
                      />
                    </div>
                    <div>Auto</div>
                  </div>
                  <div className="grid text-sm grid-cols-[minmax(4rem,auto)_minmax(5rem,auto)_1fr_minmax(4rem,auto)] items-center">
                    <div>ALIAS</div>
                    <div>www</div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(distributionDomain || "");
                          toast.success("Copied to clipboard");
                        }}
                        aria-label="Copy Points to value"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75M15.75 6v12a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h7.5A2.25 2.25 0 0115.75 6z" />
                        </svg>
                      </Button>
                      <Input
                        value={distributionDomain}
                        readOnly
                        className="font-mono text-xs bg-background border rounded px-2 py-1 min-w-0 overflow-x-auto"
                        style={{ minWidth: 0 }}
                      />
                    </div>
                    <div>Auto</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  If you can&apos;t find the ALIAS option, you can use your domain provider&apos;s &quot;redirect&quot; or &quot;forwarding&quot; feature instead.
                </p>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    💡 <strong>Why ALIAS?</strong> This is the simplest way to connect your domain. It&apos;s fast to set up and doesn&apos;t require changing your domain&apos;s nameservers.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="nameservers"
                  name="dnsSetup"
                  value="nameservers"
                  checked={dnsSetupOption === "nameservers"}
                  onChange={() => setDnsSetupOption("nameservers")}
                  className="h-4 w-4"
                />
                <label htmlFor="nameservers" className="text-sm font-medium">
                  Option 2: Advanced Domain Connection
                </label>
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  This option is more technical and takes longer to set up. You&apos;ll need to:
                </p>
                <ol className="list-decimal pl-6 text-sm text-muted-foreground space-y-2">
                  <li>Log in to your domain provider</li>
                  <li>Find the nameserver settings</li>
                  <li>Replace your current nameservers with new ones (we&apos;ll provide these)</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  Note: This change can take up to 48 hours to take effect.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={handleSetupDNS} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up DNS...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 