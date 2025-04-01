import { NextResponse } from "next/server";
import { S3Service } from "../../services/s3";
import { checkRateLimit } from "../../core/security";

const s3 = new S3Service();

export async function POST(request: Request) {
  try {
    await checkRateLimit(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const siteId = formData.get("siteId") as string;

    if (!file || !siteId) {
      return NextResponse.json(
        { error: "Missing file or siteId" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const contentType = file.type;

    const { url, metadata } = await s3.uploadAsset(
      buffer,
      fileName,
      contentType,
      type,
      siteId
    );

    return NextResponse.json({ url, metadata });
  } catch (error) {
    console.error("Error uploading asset:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}
