import BillingClient from "@/components/billing/BillingClient";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Plan and billing", noindex: true });
export default function Page() { return <BillingClient />; }
