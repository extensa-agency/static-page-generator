'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface InputPageProps {
  userId: string;
  projectId: string;
}

export default function InputPage({ userId, projectId }: InputPageProps) {
  const [domainName, setDomainName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cloudfront/certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domainName,
          useRoute53: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate domain setup");
      }

      const data = await response.json();

      if (data.validationRecords) {
        // Store the data in localStorage for the next step
        localStorage.setItem('domainSetupData', JSON.stringify({
          domainName,
          validationRecords: data.validationRecords,
          certificateArn: data.certificateArn
        }));

        // Navigate to the validation page
        router.push(`/${userId}/edit/${projectId}/domain/validation`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Domain</CardTitle>
          <CardDescription>
            Enter your domain name to start the setup process. We&apos;ll help you configure SSL and DNS settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium">
                Domain Name
              </label>
              <Input
                id="domain"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="example.com"
                className="font-mono"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the root domain or subdomain you want to use
              </p>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Start Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
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