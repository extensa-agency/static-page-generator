'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ValidationRecord {
  domainName: string;
  validationRecord: {
    Name: string;
    Type: string;
    Value: string;
  };
  status: string;
}

interface ValidationPageProps {
  userId: string;
  projectId: string;
}

export default function ValidationForm({ userId, projectId }: ValidationPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationRecords, setValidationRecords] = useState<ValidationRecord[] | null>(null);
  const [certificateArn, setCertificateArn] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const setupData = localStorage.getItem('domainSetupData');
    if (!setupData) {
      router.push(`/${userId}/edit/${projectId}/domain/input`);
      return;
    }

    const { domainName, validationRecords, certificateArn } = JSON.parse(setupData);
    setDomainName(domainName);
    setValidationRecords(validationRecords);
    setCertificateArn(certificateArn);
  }, [userId, projectId, router]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleCheckValidation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/cloudfront/certificate/status?domainName=${domainName}&certificateArn=${certificateArn}`
      );
      const data = await response.json();

      if (data.status === "ISSUED") {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/cloudfront/distribution?domainName=${domainName}&siteId=${projectId}&certificateArn=${certificateArn}`,
            {
              headers: {
                'user-id': userId
              }
            }
          );
          const data = await response.json();

          if (data.distribution) {
            console.log("data.distribution", data.distribution);
            console.log("data", data);

            // Update the stored data with distribution information
            const setupData = JSON.parse(localStorage.getItem('domainSetupData') || '{}');
            localStorage.setItem('domainSetupData', JSON.stringify({
              ...setupData,
              distributionDomain: data.distribution.DomainName
            }));

            router.push(`/${userId}/edit/${projectId}/domain/dns?distributionDomain=${data.distribution.DomainName}`);
          } else {
            setError(data.error || "Failed to create distribution");
          }
        } catch (err: any) {
          setError(err.message || "Failed to create distribution");
        } finally {
          setIsLoading(false);
        }
      } else {
        toast("Certificate validation is still in progress. Please try again in a few minutes.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to check validation status");
    } finally {
      setIsLoading(false);
    }
  };

  if (!validationRecords || !domainName) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <CardTitle>Domain Validation Required</CardTitle>
          </div>
          <CardDescription>
            Add these DNS records to your domain provider to validate ownership
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            {validationRecords.map((record, index) => (
              <div key={index} className="rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{record.domainName}</h3>
                  <Badge>{record.status}</Badge>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Name (Host)</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted p-2 rounded-md font-mono text-sm">
                        {record.validationRecord.Name}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(record.validationRecord.Name)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <code className="bg-muted p-2 rounded-md font-mono text-sm">
                      {record.validationRecord.Type}
                    </code>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Value (Points to)</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted p-2 rounded-md font-mono text-sm break-all">
                        {record.validationRecord.Value}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(record.validationRecord.Value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Next Steps</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add these DNS records to your domain provider</li>
                <li>Wait for certificate validation (can take up to 30 minutes)</li>
                <li>Once validated, we&apos;ll help you set up the final CNAME record</li>
              </ol>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleCheckValidation} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Validation Status"
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Certificate validation can take up to 30 minutes
              </p>
            </div>
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