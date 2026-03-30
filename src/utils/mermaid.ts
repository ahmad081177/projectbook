import mermaid from 'mermaid';

let initialized = false;

function ensureInit() {
  if (!initialized) {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    initialized = true;
  }
}

/**
 * Renders a Mermaid diagram string to a PNG ArrayBuffer.
 * Uses an off-screen div + canvas; browser-only (do not call in tests/SSR).
 */
export async function mermaidToImageBuffer(code: string): Promise<ArrayBuffer> {
  ensureInit();

  const id = `mermaid-render-${Date.now()}`;

  // Render SVG
  const { svg } = await mermaid.render(id, code);

  // Convert SVG string to data URL
  const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  // Draw SVG onto canvas
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = svgDataUrl;
  });

  const WIDTH = 1160;
  const HEIGHT = 760;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);

  // Convert to PNG ArrayBuffer
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png');
  });

  return blob.arrayBuffer();
}
