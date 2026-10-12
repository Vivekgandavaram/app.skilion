import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import SettingsNav from "@/components/settings/SettingsNav";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireUser("/settings/profile");
  return (<><PageHead title="Settings" /><SettingsNav /><div style={{ maxWidth: 820 }}>{children}</div></>);
}
