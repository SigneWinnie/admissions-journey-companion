export type TextLayer = {
  id: string;
  text: string;
  x: number; // 0-1 relative
  y: number; // 0-1 relative
  fontSize: number; // px at base width 600
  color: string;
  strokeColor: string;
  strokeWidth: number;
  fontFamily: string;
  bold: boolean;
  align: "left" | "center" | "right";
};

export type MemeState = {
  imageSrc: string | null;
  layers: TextLayer[];
};

export const DEFAULT_LAYER: Omit<TextLayer, "id"> = {
  text: "TOP TEXT",
  x: 0.5,
  y: 0.1,
  fontSize: 48,
  color: "#ffffff",
  strokeColor: "#000000",
  strokeWidth: 6,
  fontFamily: "Impact, Anton, Oswald, Arial Black, sans-serif",
  bold: true,
  align: "center",
};

export function drawMeme(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | null,
  layers: TextLayer[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (img) {
    ctx.drawImage(img, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#1f2230";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#9aa0b4";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Upload an image to start", W / 2, H / 2);
  }

  for (const layer of layers) {
    const fontSize = (layer.fontSize / 600) * W;
    ctx.font = `${layer.bold ? "700" : "400"} ${fontSize}px ${layer.fontFamily}`;
    ctx.textAlign = layer.align;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;

    const x = layer.x * W;
    const y = layer.y * H;
    const lines = layer.text.split("\n");
    const lineHeight = fontSize * 1.1;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      const ly = startY + i * lineHeight;
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = (layer.strokeWidth / 600) * W;
        ctx.strokeText(line, x, ly);
      }
      ctx.fillStyle = layer.color;
      ctx.fillText(line, x, ly);
    });
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const TEMPLATES: { name: string; url: string }[] = [
  { name: "Drake", url: "https://i.imgflip.com/30b1gx.jpg" },
  { name: "Distracted BF", url: "https://i.imgflip.com/1ur9b0.jpg" },
  { name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg" },
  { name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
  { name: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg" },
  { name: "This Is Fine", url: "https://i.imgflip.com/26am.jpg" },
];