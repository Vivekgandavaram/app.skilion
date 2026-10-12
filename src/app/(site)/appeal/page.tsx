import { pageMeta } from "@/lib/seo";
import AppealForm from "@/components/marketing/AppealForm";
export const metadata = pageMeta({ title: "Appeal a moderation decision", description: "Ask a person on the Skilion team to review a suspension or removal.", path: "/appeal", noindex: true });
export default function Page() {
  return (<section className="section section-white"><div className="container container-narrow stack-lg"><div className="stack-sm"><h1 className="h1">Appeal a decision</h1><p className="lead">If your account was suspended or content was removed and you think we got it wrong, tell us. A person reviews every appeal.</p></div><AppealForm /></div></section>);
}
