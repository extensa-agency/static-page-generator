import { NextResponse } from "next/server";
import { handleDistributionSetup } from "./helper";
import { CloudFrontService } from "@/app/services/cloudfront";
import { supabase } from "@/lib/supabase/client/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get("domainName");
    const siteId = searchParams.get("siteId");
    const certificateArn = searchParams.get("certificateArn");
    const userId = request.headers.get("user-id");
    let distributionId;

    // Validate required parameters
    if (!domainName || !siteId || !userId || !certificateArn) {
      return NextResponse.json(
        {
          error:
            "Domain name, site ID, user ID, and certificate ARN are required",
        },
        { status: 400 }
      );
    }

    try {
      const distribution = await handleDistributionSetup(
        siteId,
        userId,
        domainName,
        certificateArn
      );

      distributionId = distribution.Id;
      const { error } = await supabase
        .from("websites")
        .update({
          cloudfront_domain: distribution.DomainName,
          cloudfront_id: distribution.Id,
        })
        .eq("site_id", siteId)
        .select()
        .single();

      if (error) {
        console.error("[Distribution] Error updating website:", {
          error: error.message,
          stack: error.stack,
          code: error.code,
        });
      }

      return NextResponse.json({
        distribution,
        message: "Distribution created/updated successfully",
      });
    } catch (error: any) {
      // If the error is CNAMEAlreadyExists, proceed with DNS setup
      console.log("[Distribution] Error:", error);
      if (error?.Code === "CNAMEAlreadyExists") {
        try {
          // Get the distribution domain name
          const distributionDomain =
            await CloudFrontService.getDistributionDomain(distributionId);
          if (distributionDomain) {
            return NextResponse.json({
              distribution: {
                Id: `${distributionId}.cloudfront.net`,
                DomainName: distributionDomain,
                Status: "Deployed",
              },
              message: "Distribution already exists, proceeding with DNS setup",
            });
          }
        } catch (lookupError) {
          const mockDomain = `${siteId}.cloudfront.net`;
          const { error } = await supabase
            .from("websites")
            .update({
              cloudfront_domain: mockDomain,
            })
            .eq("id", siteId)
            .select()
            .single();

          if (error) {
            console.error("[Distribution] Error updating website:", {
              error: error.message,
              stack: error.stack,
              code: error.code,
              lookupError: lookupError,
            });
          }

          return NextResponse.json({
            distribution: {
              Id: `${distributionId}.cloudfront.net`,
              DomainName: mockDomain,
              Status: "Deployed",
            },
            message: "Proceeding with DNS setup using mock domain",
          });
        }
      }
      throw error;
    }
  } catch (error: any) {
    console.error("[Distribution] Error setting up distribution:", {
      error: error.message,
      stack: error.stack,
      code: error.Code,
    });
    return NextResponse.json(
      {
        error: "Failed to setup distribution",
      },
      { status: 500 }
    );
  }
}
