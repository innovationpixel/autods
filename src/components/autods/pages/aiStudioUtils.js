export function extractMediaUrl(data) {
  if (!data) return null;
  const candidates = [
    data.url,
    data.image_url,
    data.video_url,
    data.output_url,
    data.result_url,
    data.data?.url,
    data.data?.image_url,
    data.data?.video_url,
    Array.isArray(data.output) ? data.output[0] : null,
  ];
  return candidates.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function getAnchoredPosition(position, canvasW, canvasH, elW, elH, paddingX, paddingY) {
  let x;
  let y;

  if (position.includes("left")) x = paddingX;
  else if (position.includes("right")) x = canvasW - elW - paddingX;
  else x = (canvasW - elW) / 2;

  if (position.startsWith("top")) y = paddingY;
  else if (position.startsWith("bottom")) y = canvasH - elH - paddingY;
  else y = (canvasH - elH) / 2;

  return { x, y };
}

export async function composeImageWithBranding({ baseUrl, watermark, logo }) {
  const baseImg = await loadImage(baseUrl, "anonymous");

  const canvas = document.createElement("canvas");
  canvas.width = baseImg.naturalWidth;
  canvas.height = baseImg.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(baseImg, 0, 0);

  const paddingX = canvas.width * 0.035;
  const paddingY = canvas.height * 0.035;

  if (logo) {
    const logoImg = await loadImage(logo.src, "anonymous");
    const logoW = canvas.width * (logo.sizePercent / 100);
    const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth);
    const { x, y } = getAnchoredPosition(logo.position, canvas.width, canvas.height, logoW, logoH, paddingX, paddingY);
    ctx.drawImage(logoImg, x, y, logoW, logoH);
  }

  if (watermark) {
    const fontSize = Math.max(12, watermark.sizePercent * (canvas.width / 1000));
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    const textW = ctx.measureText(watermark.text).width;
    const { x, y } = getAnchoredPosition(watermark.position, canvas.width, canvas.height, textW, fontSize, paddingX, paddingY);
    ctx.lineWidth = Math.max(1, fontSize * 0.06);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.strokeText(watermark.text, x, y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(watermark.text, x, y);
  }

  return canvas.toDataURL("image/png");
}

export function newAssetId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
