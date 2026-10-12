import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Log in", path: "/login", noindex: true });
export default function Page() {
  return <AuthShell title="Welcome back" sub="Log in to find your people and pick up where you left off." footer={<>New to Skilion? <Link href="/signup">Create a free account</Link></>}><Suspense><LoginForm /></Suspense></AuthShell>;
}
