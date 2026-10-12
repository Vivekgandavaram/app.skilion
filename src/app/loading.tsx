import Image from "next/image";

/** Route-transition loading screen: original wordmark, animated ring, blurred dark background. */
export default function Loading() {
  return (
    <div className="load-screen" role="status" aria-live="polite">
      <div className="intro-glow intro-glow-a" /><div className="intro-glow intro-glow-b" />
      <div className="intro-stage">
        <span className="intro-ring" />
        <Image src="/brand/skilion-wordmark.png" alt="" width={640} height={213} priority className="load-logo" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
