import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 400 });

    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = "farmfresh/products";

    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const upload = new FormData();
    upload.append("file", file);
    upload.append("api_key", apiKey);
    upload.append("timestamp", timestamp);
    upload.append("signature", signature);
    upload.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: upload,
    });

    const data = await res.json() as { secure_url?: string; error?: { message: string } };

    if (!res.ok || !data.secure_url)
      return NextResponse.json({ error: data.error?.message ?? "Upload failed." }, { status: 500 });

    return NextResponse.json({ url: data.secure_url });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
