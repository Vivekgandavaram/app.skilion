/** Client-side image compression so uploads stay under serverless body limits. */

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This image format cannot be read. Try a JPEG or PNG."));
    img.src = src;
  });
}

/**
 * Downscale + re-encode an image in the browser.
 * A 6 MB phone photo becomes ~200-400 KB, which keeps the upload well under
 * Vercel's 4.5 MB request limit.
 */
export async function compressImage(file: Blob, maxDimension = 1600, quality = 0.85): Promise<{ dataUrl: string; width: number; height: number }> {
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  // If image is small enough already, still ensure it's reasonably sized
  if (scale === 1 && original.length < 1200000) { // ~0.9MB base64
    return { dataUrl: original, width: img.width, height: img.height };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: original, width: img.width, height: img.height };
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", quality), width, height };
}

/** Rough byte size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}
