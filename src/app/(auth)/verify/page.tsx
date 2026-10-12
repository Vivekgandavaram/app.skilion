import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import { VerifyForm } from "@/components/auth/AuthForms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Enter your code", path: "/verify", noindex: true });
export default function Page() { return <AuthShell title="Check your email" sub="Enter the code to continue."><Suspense><VerifyForm /></Suspense></AuthShell>; }
