import { randomUUID } from "@/lib/uuid";

import { supabase } from "@/integrations/supabase/client";

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.82;

/** Client-side resize/compress to keep uploads small (target: well under 2MB). */
export async function compressImage(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Sirf JPG, PNG ya WebP photo chalegi");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Photo process nahi ho saki");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Photo process nahi ho saki"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/** Uploads to photos/{gym_id}/{kind}/{uuid}.jpg (layout enforced by storage RLS). */
export async function uploadPhoto(file: File, gymId: string, kind: "members" | "employees"): Promise<string> {
  const blob = await compressImage(file);
  const path = `${gymId}/${kind}/${randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("photos").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Signed URL for display (private bucket). */
export async function photoUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("photos").createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
