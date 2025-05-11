import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export type DeploymentFile = {
  name: string;
  content: string | Buffer;
  contentType?: string;
};

export class S3Service {
  private s3: S3Client;
  public bucketName: string;
  public region: string;
  public websiteEndpoint: string;

  constructor() {
    this.region = process.env.CUSTOM_REGION || "us-east-2";
    this.bucketName = process.env.S3_BUCKET_NAME!;
    this.websiteEndpoint = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

    if (!this.bucketName) {
      throw new Error("S3_BUCKET_NAME environment variable is required");
    }

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY!,
      },
      endpoint: `https://s3.${this.region}.amazonaws.com`,
      forcePathStyle: false,
    });
  }

  // private async ensurePublicAccess() {
  //   // Set bucket policy
  //   const bucketPolicy = {
  //     Version: "2012-10-17",
  //     Statement: [
  //       {
  //         Sid: "PublicReadGetObject",
  //         Effect: "Allow",
  //         Principal: "*",
  //         Action: "s3:GetObject",
  //         Resource: [
  //           `arn:aws:s3:::${this.bucketName}`,
  //           `arn:aws:s3:::${this.bucketName}/*`,
  //           `arn:aws:s3:::${this.bucketName}/*/*`,
  //           `arn:aws:s3:::${this.bucketName}/*/*/*`,
  //         ],
  //       },
  //     ],
  //   };

  //   const corsConfiguration = {
  //     CORSRules: [
  //       {
  //         AllowedOrigins: ["*"],
  //         AllowedMethods: ["GET", "HEAD"],
  //         AllowedHeaders: ["*"],
  //         MaxAgeSeconds: 3000,
  //       },
  //     ],
  //   };

  //   try {
  //     console.log("S3Service: Setting bucket policy");
  //     console.log(
  //       "S3Service: Bucket policy:",
  //       JSON.stringify(bucketPolicy, null, 2)
  //     );

  //     await this.s3.send(
  //       new PutBucketPolicyCommand({
  //         Bucket: this.bucketName,
  //         Policy: JSON.stringify(bucketPolicy),
  //       })
  //     );
  //     console.log("S3Service: Bucket policy set successfully");

  //     console.log("S3Service: Setting CORS configuration");
  //     await this.s3.send(
  //       new PutBucketCorsCommand({
  //         Bucket: this.bucketName,
  //         CORSConfiguration: corsConfiguration,
  //       })
  //     );
  //     console.log("S3Service: CORS configuration set successfully");
  //   } catch (error) {
  //     console.error("S3Service: Error in ensurePublicAccess:");
  //     console.error(
  //       "S3Service: Error details:",
  //       JSON.stringify(error, null, 2)
  //     );
  //     console.error(
  //       "S3Service: Error stack:",
  //       error instanceof Error ? error.stack : "No stack trace"
  //     );
  //     throw error;
  //   }
  // }

  async deploy(
    siteId: string,
    files: DeploymentFile[]
  ): Promise<{ url: string }> {
    console.log("S3Service: Starting deploy operation", {
      siteId,
      fileCount: files.length,
    });

    try {
      console.log("S3Service: Creating upload promises");
      const uploadPromises = files.map((file) => {
        const key = `${siteId}/${file.name}`;

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.content,
          ContentType: file.contentType || "text/html",
        });

        console.log(`S3Service: Preparing to upload ${key}`);
        return this.s3
          .send(command)
          .then((result) => {
            console.log(`S3Service: Successfully uploaded ${key}`);
            return result;
          })
          .catch((error) => {
            console.error(`S3Service: Error uploading ${key}:`, error);
            throw error;
          });
      });

      console.log("S3Service: Starting all uploads");
      await Promise.all(uploadPromises);
      console.log("S3Service: All uploads completed successfully");

      console.log("S3Service: Deployment completed");
      return {
        url: `${this.websiteEndpoint}/${siteId}/index.html`,
      };
    } catch (error) {
      console.error("S3Service: Error in deploy operation:", error);
      console.error(
        "S3Service: Error details:",
        JSON.stringify(error, null, 2)
      );
      console.error(
        "S3Service: Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      throw error;
    }
  }

  async getDeploymentStatus(
    siteId: string
  ): Promise<"completed" | "not_found"> {
    try {
      console.log(`S3Service: Checking deployment status for ${siteId}`);
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: `${siteId}/index.html`,
        })
      );
      console.log(`S3Service: Deployment status for ${siteId} is completed`);
      return "completed";
    } catch (error) {
      console.log(
        `S3Service: Deployment status for ${siteId} is not_found`,
        error
      );
      return "not_found";
    }
  }

  async deleteSite(siteId: string) {
    try {
      console.log(`S3Service: Starting deletion of site ${siteId}`);
      // First, list all objects with the siteId prefix
      const listResponse = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: `${siteId}/`,
        })
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        console.log(
          `S3Service: Found ${listResponse.Contents.length} objects to delete`
        );
        // Delete all objects found
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: listResponse.Contents.map(({ Key }) => ({ Key })),
            },
          })
        );
        console.log(
          `S3Service: Successfully deleted all objects for ${siteId}`
        );
      } else {
        console.log(`S3Service: No objects found for site ${siteId}`);
      }
    } catch (error) {
      console.error(`S3Service: Failed to delete site ${siteId}:`, error);
      console.error(
        "S3Service: Error details:",
        JSON.stringify(error, null, 2)
      );
      throw new Error("Failed to delete site");
    }
  }

  async uploadAsset(
    buffer: ArrayBuffer,
    fileName: string,
    contentType: string,
    type: string,
    siteId: string
  ): Promise<{
    url: string;
    metadata: { width: number; height: number; aspectRatio: number };
  }> {
    console.log(`S3Service: Uploading asset ${fileName} for site ${siteId}`);
    const key = `${siteId}/assets/${type}s/${fileName}`;

    try {
      console.log("S3Service: Getting image metadata");
      const metadata = await this.getImageMetadata(buffer);
      console.log("S3Service: Image metadata", metadata);

      console.log(`S3Service: Uploading to ${key}`);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: contentType,
          Metadata: {
            width: metadata.width.toString(),
            height: metadata.height.toString(),
            aspectRatio: metadata.aspectRatio.toString(),
          },
        })
      );

      // Use website endpoint format consistently
      const url = `${this.websiteEndpoint}/${key}`;
      console.log(`S3Service: Asset uploaded successfully, URL: ${url}`);
      return { url, metadata };
    } catch (error) {
      console.error(`S3Service: Upload failed for ${fileName}:`, error);
      console.error(
        "S3Service: Error details:",
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  async uploadPreview(siteId: string, buffer: Buffer): Promise<string> {
    try {
      console.log(`S3Service: Uploading preview for site ${siteId}`);
      const key = `${siteId}/preview.png`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: "image/png",
          Metadata: {
            "x-amz-meta-site-id": siteId,
            "x-amz-meta-type": "preview",
          },
        })
      );

      // Use website endpoint format consistently
      const url = `${this.websiteEndpoint}/${key}`;
      console.log(`S3Service: Preview uploaded successfully, URL: ${url}`);
      return url;
    } catch (error) {
      console.error(`S3Service: Preview upload failed for ${siteId}:`, error);
      console.error(
        "S3Service: Error details:",
        JSON.stringify(error, null, 2)
      );
      throw new Error("Failed to upload preview image");
    }
  }

  async deletePreview(siteId: string) {
    try {
      console.log(`S3Service: Deleting preview for site ${siteId}`);
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: `${siteId}/preview.png`,
        })
      );
      console.log(`S3Service: Preview deleted successfully for ${siteId}`);
    } catch (error) {
      console.error(
        `S3Service: Failed to delete preview for ${siteId}:`,
        error
      );
      console.error(
        "S3Service: Error details:",
        JSON.stringify(error, null, 2)
      );
      throw new Error("Failed to delete preview");
    }
  }

  private async getImageMetadata(buffer: ArrayBuffer): Promise<{
    width: number;
    height: number;
    aspectRatio: number;
  }> {
    try {
      console.log("S3Service: Processing image metadata");
      // Use sharp to get image dimensions
      const sharp = (await import("sharp")).default;
      const image = sharp(Buffer.from(buffer));
      const { width, height } = await image.metadata();

      if (!width || !height) {
        throw new Error("Could not get image dimensions");
      }

      const metadata = {
        width,
        height,
        aspectRatio: width / height,
      };
      console.log("S3Service: Image metadata processed", metadata);
      return metadata;
    } catch (error) {
      console.error("S3Service: Error getting image metadata:", error);
      console.error(
        "S3Service: Error details:",
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }
}
