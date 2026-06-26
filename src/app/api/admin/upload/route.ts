import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 400 });

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize)
      return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "farmfresh/products", resource_type: "image" },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result as { secure_url: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
