import { NextResponse } from "next/server";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import * as uploadStorage from "@/lib/upload-storage";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeFilename = path.basename(filename);
  const candidates = [
    path.join(uploadStorage.getUploadsDir(), safeFilename),
    path.join(uploadStorage.getLegacyUploadsDir(), safeFilename),
  ];

  for (const filePath of candidates) {
    try {
      await access(filePath);
      const file = await readFile(filePath);
      const extension = path.extname(safeFilename).toLowerCase();
      return new NextResponse(file, {
        headers: {
          "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {}
  }

  return new NextResponse("Not Found", { status: 404 });
}
