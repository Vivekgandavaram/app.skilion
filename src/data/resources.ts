export type Guide = { slug: string; title: string; description: string; minutes: number; published: string; sections: { h: string; p: string[] }[] };

export const GUIDES: Guide[] = [
  {
    slug: "validate-an-idea-in-four-weeks",
    title: "How to validate an idea in four weeks with a small squad",
    description: "A week-by-week plan for a three-person squad to find out whether an idea deserves more time.",
    minutes: 6, published: "2026-10-10",
    sections: [
      { h: "Start with the riskiest assumption", p: ["Most ideas fail on one belief: that a specific person has a specific problem and will change behaviour to solve it. Write that belief as a sentence you could be proven wrong about. Everything else in the four weeks serves that sentence.", "Skip features, names and logos for now. A validation squad needs people who can talk to customers, make something visible and keep the plan honest."] },
      { h: "Pick three roles, not ten", p: ["A product lead who owns the question and the decision. A designer who can turn the idea into something people can react to. An outreach or growth person who can find ten people to talk to.", "Each person should commit 4 to 6 hours a week. That is realistic around a day job and enough for a focused month."] },
      { h: "Week by week", p: ["Week 1: agree the assumption, the target person and what result would make you continue or stop. Book interviews.", "Week 2: run at least eight conversations. Ask about the last time the problem happened, not whether they would buy.", "Week 3: show a clickable concept or a landing page to five people from the target group. Count what they do, not what they say.", "Week 4: review evidence together. Decide to continue, change direction or stop, and write the reason down in the project decision log."] },
      { h: "What counts as evidence", p: ["Evidence is behaviour: someone shared contact details, booked a call, paid a deposit or used a rough version twice. Compliments are not evidence.", "Stopping is a good result. A squad that learns in four weeks that an idea is weak has saved months."] },
    ],
  },
  {
    slug: "sell-your-skills-not-your-hours",
    title: "Sell your skills, not your hours",
    description: "Why expertise beats cheap part-time labour, and how to package what you know.",
    minutes: 5, published: "2026-10-10",
    sections: [
      { h: "Hours are a weak product", p: ["When you sell hours you compete with everyone who has hours. The price drifts down and the work stays shallow. When you sell an outcome that depends on your judgment, the comparison changes.", "That is the idea behind Skilion for people with a day job: use your evenings on work where your expertise changes the result."] },
      { h: "Package a result", p: ["Write down three things you can do for a team in 45 minutes, in one week and in one month. For example: review a data model, design a first user flow, or build a proof of concept for a sensor.", "Name the result, not the activity. Instead of 'consulting', say 'a reviewed architecture with the three biggest risks marked'."] },
      { h: "Choose how you are rewarded", p: ["Pay suits scoped help. Equity or revenue share suits ongoing work in a team you believe in. Learning credit suits a new field. Volunteering suits causes you care about.", "Agree the reward before the work starts and write it in the project. Skilion does not hold money between members, so clear terms protect both sides."] },
      { h: "Protect your time", p: ["Set weekly hours on your profile and keep them honest. Use the after-work and weekend presets, and block weeks when you are busy. It is better to turn down a role than to slip on it."] },
    ],
  },
  {
    slug: "building-beside-a-nine-to-six",
    title: "Building on weekday evenings: a realistic plan beside a 9-to-6",
    description: "How to make steady progress on a project with five to eight hours a week.",
    minutes: 6, published: "2026-10-10",
    sections: [
      { h: "Count the real hours", p: ["Most people with a full-time job can find five to eight honest hours a week: two weeknight blocks and one weekend block. Plan with that, not with your best week.", "Put the blocks on a calendar and set them in your Skilion availability so teammates see when you are reachable."] },
      { h: "Work in small, finishable pieces", p: ["Cut work into pieces that fit one block and end with something visible: a screen, a test, a note. Unfinished work from a tired evening is hard to resume.", "End each block by writing the next action in the project so that you can start in two minutes next time."] },
      { h: "Use time zones and overlap", p: ["The seven-day overlap view in the Squad Cart shows when your squad can talk live. Aim for two shared hours a week for planning and use written check-ins for everything else."] },
      { h: "Be honest about capacity", p: ["Tell the team early when a week is lost. A weekly check-in that records hours worked builds trust and shows whether the plan is realistic."] },
    ],
  },
  {
    slug: "what-proof-of-work-means",
    title: "What proof of work means on Skilion",
    description: "How evidence-backed skills, badges and endorsements work, and what they do not promise.",
    minutes: 5, published: "2026-10-10",
    sections: [
      { h: "Claims and evidence are different", p: ["On Skilion a skill you list is a claim until you link it to a project that uses it. Skills with project evidence are marked, so a visitor can tell the difference at a glance."] },
      { h: "What each badge checks", p: ["Email: you control the email address. Google or GitHub linked: you signed in with an account whose email the provider verified. Repository owner: you own the repository linked on a project. Peer endorsed: another member vouched for a skill after working with you. Identity checked: a verifier reviewed an identity document.", "No badge says more than that. A GitHub link does not prove you wrote every line in a repository, and an endorsement is an opinion."] },
      { h: "Showing work well", p: ["Lead with two or three projects. For each one say your role, the contribution type (personal, collaborative or client), the tools and the outcome. Link a demo or repository. Private client work can be listed without links."] },
    ],
  },
  {
    slug: "write-a-bond-request-people-accept",
    title: "How to write a bond request people actually accept",
    description: "Short, specific notes beat generic hellos. Here is a template.",
    minutes: 4, published: "2026-10-10",
    sections: [
      { h: "Say why this person", p: ["Mention one thing you saw in their work. 'I saw your sensor logging project' is better than 'I like your profile'."] },
      { h: "Say what you want to do together", p: ["Name the goal in one line: validate, prototype, a focused question or a company. Add the time you can give and when you are free."] },
      { h: "A template", p: ["Hi Priya, I saw your field-robot demo. I am planning a four-week prototype of a crop-scouting tool and need someone for the navigation part, about 4 hours a week in the evenings IST. Could we talk for 20 minutes this weekend?", "Keep it under 280 characters, ask for one small next step and respect a no. Bond requests are rate limited and expire after 30 days."] },
    ],
  },
  {
    slug: "splitting-equity-revenue-share-and-pay",
    title: "Splitting equity, revenue share and pay in a small team",
    description: "General information on common ways small teams reward contributors, and when to get advice.",
    minutes: 6, published: "2026-10-10",
    sections: [
      { h: "A note first", p: ["This guide is general information. It is not legal, tax or financial advice. Rules differ by country and by company type, so talk to a qualified adviser before you commit to anything that has value."] },
      { h: "Four common models", p: ["Paid: a fixed fee for a scoped result. Simple, and best for short help.", "Equity: a share of the company, often vesting over time, suited to people who will stay and carry risk.", "Revenue share: a percentage of income from a product, suited to projects that can earn without becoming a company.", "Learning credit or volunteering: a clear, fair exchange of experience, mentoring or a cause, with expectations written down."] },
      { h: "Write it down early", p: ["Record who does what, how many hours, how decisions are made, what happens if someone leaves and who owns the work. Use the project decision log so everyone can see it.", "Revisit the agreement when the team or the idea changes."] },
      { h: "When to get advice", p: ["Get professional advice before issuing equity, signing anything about intellectual property or promising money you do not yet have."] },
    ],
  },
];
export const guideBySlug = (s: string) => GUIDES.find((g) => g.slug === s);
