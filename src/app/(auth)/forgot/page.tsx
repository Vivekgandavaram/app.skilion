import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { ForgotForm } from "@/components/auth/AuthForms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Reset your password", path: "/forgot", noindex: true });
export default function Page() { return <AuthShell title="Forgot your password?" sub="We will email you a code to set a new one." footer={<Link href="/login">Back to log in</Link>}><ForgotForm /></AuthShell>; }
