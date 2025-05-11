import {
  CloudFrontClient,
  CreateDistributionCommand,
  GetDistributionCommand,
  UpdateDistributionCommand,
  ViewerProtocolPolicy,
  ItemSelection,
  PriceClass,
  SSLSupportMethod,
  MinimumProtocolVersion,
} from "@aws-sdk/client-cloudfront";
import { ACMClient, ListCertificatesCommand } from "@aws-sdk/client-acm";
// import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.CUSTOM_REGION;

const cloudfrontClient = new CloudFrontClient({
  region,
  credentials: {
    accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
  },
});

interface CreateDistributionParams {
  userId: string;
  siteId: string;
  certificateArn?: string;
  domainName?: string;
  domainNames?: string[];
}

export class CloudFrontService {
  /**
   * Creates a new CloudFront distribution for a user's static site
   */
  static async createDistribution({
    userId,
    siteId,
    certificateArn,
    domainName,
    domainNames,
  }: CreateDistributionParams) {
    try {
      console.log("[CloudFront] Starting distribution creation with params:", {
        userId,
        siteId,
        certificateArn,
        domainName,
        domainNames,
      });

      // Use static OAI from environment variables
      const oaiId = process.env.CLOUDFRONT_ORIGIN_ACCESS_ID;

      if (!oaiId) {
        throw new Error(
          "CloudFront OAI configuration is missing in environment variables"
        );
      }

      console.log("[CloudFront] Using OAI ID:", oaiId);

      // Update S3 bucket policy to allow OAI access to all site paths
      // const s3Client = new S3Client({
      //   region: process.env.CUSTOM_REGION,
      //   credentials: {
      //     accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
      //     secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
      //   },
      // });

      // const bucketPolicy = {
      //   Version: "2012-10-17",
      //   Statement: [
      //     {
      //       Sid: "AllowCloudFrontAccess",
      //       Effect: "Allow",
      //       Principal: {
      //         AWS: `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${process.env.CLOUDFRONT_ORIGIN_ACCESS_ID}`,
      //       },
      //       Action: "s3:GetObject",
      //       Resource: `arn:aws:s3:::${process.env.S3_BUCKET_NAME}/*`,
      //     },
      //   ],
      // };

      // await s3Client.send(
      //   new PutBucketPolicyCommand({
      //     Bucket: process.env.S3_BUCKET_NAME,
      //     Policy: JSON.stringify(bucketPolicy),
      //   })
      // );

      // Determine the domain names to use
      let aliasItems: string[] = [];
      let aliasQuantity = 0;

      if (domainNames && domainNames.length > 0) {
        // Use the array of domain names if provided
        aliasItems = domainNames;
        aliasQuantity = domainNames.length;
      } else if (domainName) {
        // Fallback to single domain name for backward compatibility
        aliasItems = [domainName];
        aliasQuantity = 1;
      }

      // Create the distribution configuration
      const distributionConfig = {
        CallerReference: `${userId}-${Date.now()}`,
        Comment: `Distribution for user ${userId}`,
        DefaultRootObject: "index.html",
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: `${process.env.S3_BUCKET_NAME}-origin`,
              DomainName: `${process.env.S3_BUCKET_NAME}.s3.${process.env.CUSTOM_REGION}.amazonaws.com`,
              OriginPath: `/${siteId}`,
              S3OriginConfig: {
                OriginAccessIdentity: `origin-access-identity/cloudfront/${oaiId}`,
              },
            },
          ],
        },
        DefaultCacheBehavior: {
          TargetOriginId: `${process.env.S3_BUCKET_NAME}-origin`,
          ForwardedValues: {
            QueryString: false,
            Cookies: {
              Forward: ItemSelection.none,
            },
          },
          ViewerProtocolPolicy: ViewerProtocolPolicy.redirect_to_https,
          MinTTL: 0,
        },
        ViewerCertificate: certificateArn
          ? {
              ACMCertificateArn: certificateArn,
              SSLSupportMethod: SSLSupportMethod.sni_only,
              MinimumProtocolVersion: MinimumProtocolVersion.TLSv1_2_2021,
            }
          : {
              CloudFrontDefaultCertificate: true,
              SSLSupportMethod: SSLSupportMethod.sni_only,
              MinimumProtocolVersion: MinimumProtocolVersion.TLSv1_2_2021,
            },
        // Updated Aliases configuration to handle multiple domains
        Aliases:
          aliasQuantity > 0
            ? { Quantity: aliasQuantity, Items: aliasItems }
            : undefined,
        PriceClass: PriceClass.PriceClass_100,
        Enabled: true,
        HttpVersion: "http2" as const,
        IsIPV6Enabled: true,
      };

      console.log(
        "[CloudFront] Distribution config:",
        JSON.stringify(distributionConfig, null, 2)
      );

      const command = new CreateDistributionCommand({
        DistributionConfig: distributionConfig,
      });

      console.log("[CloudFront] Sending create distribution command");
      const response = await cloudfrontClient.send(command);
      console.log("[CloudFront] Create distribution response:", response);

      return response.Distribution;
    } catch (error: any) {
      console.error("[CloudFront] Error creating distribution:", {
        error: error?.message || "Unknown error",
        code: error?.Code,
        stack: error?.stack,
      });
      throw error;
    }
  }

  /**
   * Gets the status of a CloudFront distribution
   */
  static async getDistributionStatus(distributionId: string) {
    try {
      const command = new GetDistributionCommand({
        Id: distributionId,
      });

      const response = await cloudfrontClient.send(command);
      return response.Distribution?.Status;
    } catch (error) {
      console.error("Error getting distribution status:", error);
      throw error;
    }
  }

  /**
   * Updates a CloudFront distribution
   */
  static async updateDistribution(distributionId: string, config: any) {
    try {
      const command = new UpdateDistributionCommand({
        Id: distributionId,
        DistributionConfig: config,
        IfMatch: "", // You'll need to get this from the current distribution
      });

      const response = await cloudfrontClient.send(command);
      return response.Distribution;
    } catch (error) {
      console.error("Error updating distribution:", error);
      throw error;
    }
  }

  /**
   * Gets the certificate ARN for a domain from ACM
   */
  static async getCertificateArn(
    domainName: string
  ): Promise<string | undefined> {
    try {
      const acmClient = new ACMClient({
        region: "us-east-1", // ACM certificates must be in us-east-1 for CloudFront
        credentials: {
          accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
        },
      });

      const command = new ListCertificatesCommand({});
      const response = await acmClient.send(command);

      if (!response.CertificateSummaryList) {
        return undefined;
      }

      // Find the certificate that matches the domain
      const certificate = response.CertificateSummaryList.find(
        (cert) =>
          cert.DomainName === domainName ||
          cert.SubjectAlternativeNameSummaries?.includes(domainName)
      );

      return certificate?.CertificateArn;
    } catch (error) {
      console.error("Error getting certificate ARN:", error);
      throw error;
    }
  }

  /**
   * Gets the domain name of a CloudFront distribution
   */
  static async getDistributionDomain(distributionId: string) {
    try {
      const command = new GetDistributionCommand({
        Id: distributionId,
      });

      const response = await cloudfrontClient.send(command);
      return response.Distribution?.DomainName;
    } catch (error) {
      console.error("Error getting distribution domain:", error);
      throw error;
    }
  }
}
