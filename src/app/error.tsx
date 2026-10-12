"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container stack center" style={{ paddingBlock: 96, alignItems: "center" }}>
      <h1 className="h1">Something went wrong</h1>
      <p className="lead">This is on us. Try again, and if it keeps happening, tell us at the contact page.</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </main>
  );
}
