import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import { ResetForm } from "@/components/auth/AuthForms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Choose a new password", path: "/reset", noindex: true });
export default function Page() { return <AuthShell title="Choose a new password" sub="Enter your code and a new password."><Suspense><ResetForm /></Suspense></AuthShell>; }
