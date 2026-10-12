import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Create your account", description: "Join Skilion free. Show your work, find collaborators and form squads.", path: "/signup" });
export default function Page() {
  return <AuthShell title="Create your account" sub="Free to start. No card needed." footer={<>Already have an account? <Link href="/login">Log in</Link></>}><Suspense><SignupForm /></Suspense></AuthShell>;
}
