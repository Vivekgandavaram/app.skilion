import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import ProjectsList from "@/components/projects/ProjectsList";
import { pageMeta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Projects", path: "/projects", noindex: true });
export default async function Page() { await requireUser("/projects"); return (<><PageHead title="Projects" sub="Your squads: tasks, milestones, check-ins and decisions in one place." /><ProjectsList /></>); }
