/** Skill normalisation: "ReactJS", "react.js" and "React" become one skill. */
const SYN: Record<string, string> = {
  reactjs: "react", "react.js": "react", "react js": "react", nextjs: "next.js", "next js": "next.js", nodejs: "node.js", node: "node.js", "node js": "node.js",
  js: "javascript", ts: "typescript", py: "python", golang: "go", "c plus plus": "c++", cpp: "c++", "c#": "c#", dotnet: ".net", "asp.net core": ".net",
  ml: "machine learning", "ai/ml": "machine learning", "deep-learning": "deep learning", dl: "deep learning", cv: "computer vision", nlp: "natural language processing",
  llm: "llms", llms: "llms", genai: "generative ai", "gen ai": "generative ai",
  ux: "ux design", ui: "ui design", "ui/ux": "ux design", "ui ux": "ux design", "product design": "product design", figma: "figma",
  aws: "aws", gcp: "google cloud", k8s: "kubernetes", devops: "devops", "ci/cd": "ci/cd", postgres: "postgresql", pg: "postgresql", mongo: "mongodb", mongodb: "mongodb",
  iot: "iot", "embedded": "embedded systems", "embedded systems": "embedded systems", ros2: "ros 2", ros: "ros 2", "ros 2": "ros 2",
  pm: "product management", "product manager": "product management", seo: "seo", growth: "growth marketing", "content marketing": "content marketing",
};
export function normSkill(raw: string): { name: string; slug: string } {
  const clean = raw.trim().replace(/\s+/g, " ");
  const key = clean.toLowerCase();
  const slug = SYN[key] || key;
  const name = clean.length <= 3 ? clean.toUpperCase() : slug.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\bAi\b/g, "AI").replace(/\bMl\b/g, "ML").replace(/\bUx\b/g, "UX").replace(/\bUi\b/g, "UI").replace(/\bAws\b/g, "AWS").replace(/\bIot\b/g, "IoT").replace(/\bSeo\b/g, "SEO").replace(/\bLlms\b/g, "LLMs");
  return { name, slug };
}
export const slugOf = (s: string) => normSkill(s).slug;
export function dedupeSkills<T extends { slug: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((s) => (seen.has(s.slug) ? false : (seen.add(s.slug), true)));
}
