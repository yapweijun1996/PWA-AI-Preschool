const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxFileBytes = 8 * 1024 * 1024;
const maxDataUriBytes = 300 * 1024;

export function validateImageFile(file) {
  if (!file || !allowedTypes.has(file.type))
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > maxFileBytes)
    throw new Error("Image must be nonempty and no larger than 8 MB.");
  return file;
}

export function fitWithin(width, height, max = 640) {
  if (![width, height, max].every(value => Number.isFinite(value) && value > 0))
    throw new Error("Image dimensions and maximum size must be positive finite numbers.");
  const scale = Math.min(1, max / width, max / height);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale))
  };
}

export async function fileToDataUri(file) {
  validateImageFile(file);
  if (typeof document === "undefined" || typeof Image === "undefined" ||
    typeof URL.createObjectURL !== "function")
    throw new Error("Photo processing requires a browser with canvas support.");
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(
        new Error("Unable to decode this image. Choose a valid PNG, JPEG, or WebP file."));
      image.src = url;
    });
    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo processing requires a working canvas context.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    for (const quality of [.72, .62, .52, .42, .32, .22, .12, .1]) {
      const uri = canvas.toDataURL("image/jpeg", quality);
      if (!uri.startsWith("data:image/jpeg;base64,"))
        throw new Error("Unable to encode this image as JPEG.");
      // Include the URI header and base64 overhead in the storage limit.
      if (uri.length <= maxDataUriBytes) return uri;
    }
    throw new Error("Unable to compress this image to 300 KB. Choose a simpler or smaller image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
