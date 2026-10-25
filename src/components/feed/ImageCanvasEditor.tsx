"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Crop, Grid2X2, RotateCcw, RotateCw, X } from "lucide-react";

const FRAMES = [
  { value: "original", label: "Original" },
  { value: "1:1", label: "Square" },
  { value: "4:5", label: "Portrait" },
  { value: "16:9", label: "Landscape" },
  { value: "4:3", label: "Classic" },
] as const;
type Frame = (typeof FRAMES)[number]["value"];
type Point = { x: number; y: number };
type CropRect = { x: number; y: number; width: number; height: number };

function rotateSource(image: HTMLImageElement, degrees: number) {
  if (degrees % 360 === 0) return image;
  const sideways = Math.abs(degrees % 180) === 90;
  const canvas = document.createElement("canvas");
  canvas.width = sideways ? image.naturalHeight : image.naturalWidth;
  canvas.height = sideways ? image.naturalWidth : image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return image;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  return canvas;
}

function cropRect(width: number, height: number, frame: Frame, zoom: number, center: Point): CropRect {
  const ratio = frame === "original" ? width / height : Number(frame.split(":")[0]) / Number(frame.split(":")[1]);
  let cropWidth = width;
  let cropHeight = height;
  if (cropWidth / cropHeight > ratio) cropWidth = cropHeight * ratio;
  else cropHeight = cropWidth / ratio;
  cropWidth /= zoom;
  cropHeight /= zoom;
  const x = Math.min(width - cropWidth / 2, Math.max(cropWidth / 2, center.x * width)) - cropWidth / 2;
  const y = Math.min(height - cropHeight / 2, Math.max(cropHeight / 2, center.y * height)) - cropHeight / 2;
  return { x, y, width: cropWidth, height: cropHeight };
}

export default function ImageCanvasEditor({ imageSrc, onClose, onApply }: { imageSrc: string; onClose: () => void; onApply: (dataUrl: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState("");
  const [frame, setFrame] = useState<Frame>("original");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Point>({ x: 0.5, y: 0.5 });
  const [rotation, setRotation] = useState(0);
  const [grid, setGrid] = useState(true);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; center: Point } | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    const next = new Image();
    next.onload = () => { setImage(next); setError(""); };
    next.onerror = () => setError("This image could not be opened.");
    next.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    const canvas = previewRef.current;
    const stage = stageRef.current;
    if (!image || !canvas || !stage) return;
    const draw = () => {
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * dpr);
      canvas.height = Math.round(bounds.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, bounds.width, bounds.height);
      const source = rotateSource(image, rotation);
      const rect = cropRect(source.width, source.height, frame, zoom, center);
      ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, bounds.width, bounds.height);
      if (grid) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.58)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
          const x = (bounds.width * i) / 3;
          const y = (bounds.height * i) / 3;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, bounds.height); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(bounds.width, y); ctx.stroke();
        }
        ctx.restore();
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [image, frame, zoom, center, rotation, grid]);

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, center };
  }

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!image || !drag || !stage || drag.pointerId !== event.pointerId) return;
    const source = rotateSource(image, rotation);
    const rect = cropRect(source.width, source.height, frame, zoom, drag.center);
    const bounds = stage.getBoundingClientRect();
    const x = drag.center.x - ((event.clientX - drag.x) * rect.width) / (bounds.width * source.width);
    const y = drag.center.y - ((event.clientY - drag.y) * rect.height) / (bounds.height * source.height);
    setCenter({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
  }

  function applyCrop() {
    if (!image) return;
    setSaving(true);
    try {
      const source = rotateSource(image, rotation);
      const rect = cropRect(source.width, source.height, frame, zoom, center);
      const scale = Math.min(1600 / rect.width, 1600 / rect.height, 1);
      const output = document.createElement("canvas");
      output.width = Math.max(1, Math.round(rect.width * scale));
      output.height = Math.max(1, Math.round(rect.height * scale));
      const ctx = output.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable.");
      ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, output.width, output.height);
      onApply(output.toDataURL("image/jpeg", 0.86));
    } catch {
      setError("Could not prepare this crop. Try another image.");
      setSaving(false);
    }
  }

  if (!mounted) return null;
  return createPortal(
    <div className="image-editor-backdrop">
      <section className="image-editor" role="dialog" aria-modal="true" aria-labelledby="image-editor-title">
        <header className="image-editor-header">
          <div className="image-editor-title"><span className="image-editor-icon"><Crop size={18} aria-hidden /></span><div><h2 id="image-editor-title">Frame your photo</h2><span>Choose a canvas and position your image</span></div></div>
          <button type="button" className="image-editor-close" aria-label="Close editor" onClick={onClose}><X size={20} aria-hidden /></button>
        </header>
        <div className="image-editor-body">
          <div className="image-editor-preview-column">
            <div className="image-editor-stage" ref={stageRef}>
              {image ? <canvas ref={previewRef} aria-label="Photo crop canvas" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} /> : <span className="spinner" />}
            </div>
            {error && <p className="image-editor-error" role="alert">{error}</p>}
          </div>
          <aside className="image-editor-controls">
            <div>
              <label className="image-editor-label">Canvas format</label>
              <div className="image-editor-ratios" role="group" aria-label="Canvas format">
                {FRAMES.map((option) => <button type="button" key={option.value} className={frame === option.value ? "selected" : ""} aria-pressed={frame === option.value} onClick={() => setFrame(option.value)}>{option.label}</button>)}
              </div>
            </div>
            <div className="image-editor-zoom">
              <label className="image-editor-label" htmlFor="image-editor-zoom">Zoom <span>{zoom.toFixed(1)}x</span></label>
              <input id="image-editor-zoom" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </div>
            <div>
              <label className="image-editor-label">Adjust</label>
              <div className="image-editor-tools">
                <button type="button" title="Rotate left" aria-label="Rotate left" onClick={() => setRotation((value) => (value + 270) % 360)}><RotateCcw size={17} aria-hidden /></button>
                <button type="button" title="Rotate right" aria-label="Rotate right" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw size={17} aria-hidden /></button>
                <button type="button" className={grid ? "selected" : ""} aria-pressed={grid} title="Toggle framing grid" aria-label="Toggle framing grid" onClick={() => setGrid((value) => !value)}><Grid2X2 size={17} aria-hidden /></button>
                <button type="button" title="Reset framing" onClick={() => { setZoom(1); setCenter({ x: 0.5, y: 0.5 }); setRotation(0); setFrame("original"); }}>Reset</button>
              </div>
            </div>
          </aside>
        </div>
        <footer className="image-editor-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!image || saving} onClick={applyCrop}>{saving ? <span className="spinner" /> : <><Check size={17} aria-hidden />Use this frame</>}</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}