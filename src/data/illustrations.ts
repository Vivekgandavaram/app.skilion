/**
 * Every illustration slot on the site.
 *  - Generate an image from `scene` with the brand template (see `fullPrompt`), then save it as
 *    public/illustrations/<id>.webp  (png / jpg / svg / avif also work).
 *  - Run `npm run assets:sync` (automatic on dev/build). The placeholder is replaced by your image.
 */
export type Slot = {
  id: string;
  title: string;
  w: number;
  h: number;
  where: string;
  alt: string; // "" = decorative
  clear: "left" | "right" | "top" | "bottom" | "none"; // area to leave empty for copy
  scene: string;
};

const S = (id: string, title: string, w: number, h: number, where: string, alt: string, clear: Slot["clear"], scene: string): Slot => ({ id, title, w, h, where, alt, clear, scene });

export const SLOTS: Slot[] = [
  S("hero", "Home hero", 1600, 1200, "Home page hero (right half)", "Builders from different disciplines gathered around a project board, comparing skills and proof of work", "left",
    "A diverse group of four builders collaborating around a large project board and laptop screens, each holding a different artifact (UI mock, circuit board, data chart, content calendar). A grounded central monument-like brand pillar made of glass panels in the middle. Visible cues for idea, people, skills and opportunity. Evening light through a window hints that some of them work after their day job."),
  S("after-hours", "After-hours builders", 1400, 1000, "Home: 'for people with a day job' section", "A professional closing a work laptop at 6 pm and opening a personal project on the same desk", "right",
    "A professional in office-casual clothes at a home desk in the evening, a work badge on the chair behind them, switching from a corporate laptop to a personal project board on a second screen. A video call tile shows two teammates. Warm window light turning to blue dusk."),
  S("method-profile", "How it works: profile", 900, 700, "How it works step 1", "A builder adding a project with a demo link to their profile", "none",
    "A builder at a laptop adding a project to a profile card: demo thumbnail, repo link chip and skill chips with small evidence markers. Simple abstract UI marks only."),
  S("method-discover", "How it works: discover", 900, 700, "How it works step 2", "Profile cards being compared side by side with skill filters", "none",
    "Three profile cards fanned out on a glass panel with filter chips and a time-zone overlap strip. A hand pointing at one card. Abstract UI marks only."),
  S("method-squad", "How it works: squad", 900, 700, "How it works step 3", "A small team assembled on a squad cart board with role slots", "none",
    "Four role slots on a board (design, engineering, AI, product), three filled with avatars and one highlighted as a gap with a small vermilion marker. A seven-day availability strip underneath."),
  S("method-workspace", "How it works: workspace", 900, 700, "How it works step 4", "A team working in a shared project workspace with tasks and milestones", "none",
    "A team of three around a kanban board with milestones and a check-in note, one person presenting a prototype on a laptop."),
  S("goal-validate", "Goal: validate an idea", 1200, 900, "Home goals + For founders", "A founder interviewing a potential customer while two teammates take notes", "none",
    "A founder in a calm interview setting with a potential customer, two teammates taking notes on a wall of sticky assumptions. Believable, candid poses."),
  S("goal-prototype", "Goal: build a prototype", 1200, 900, "Home goals + For founders", "Two builders assembling a first prototype on a bench with a laptop and a small device", "none",
    "A designer and an engineer building a first prototype together: wireframes on one screen, a breadboard and sensor on the bench."),
  S("goal-help", "Goal: get help", 1200, 900, "Home goals + For builders", "A specialist giving a focused 45-minute session to a founder on a video call", "none",
    "A specialist on a video call sharing their screen to unblock a founder, a timer and a short checklist on the screen. Calm, focused, evening setting."),
  S("goal-company", "Goal: build a company", 1200, 900, "Home goals + For founders", "A founding team of four at a whiteboard defining roles and ownership", "none",
    "Four co-founders at a whiteboard mapping roles, a simple ownership pie and a first-customer list. Modern small office, plants, laptops."),
  S("global", "Global collaboration", 1600, 900, "Home: global collaboration CTA", "People across regions connected on a restrained network map", "left",
    "A restrained globe/network diagram with profile nodes connected across regions as a data metaphor, simple optional labels, no fantasy planet."),
  S("opp-research", "Opportunity: acoustic research", 960, 640, "Opportunity card", "Underwater acoustic research equipment being prepared on a boat deck", "none",
    "Clean vector scene of a hydrophone array and a laptop with a waveform on a small research boat deck."),
  S("opp-robotics", "Opportunity: field robot", 960, 640, "Opportunity card", "An autonomous field robot in a test environment with two engineers", "none",
    "A four-wheeled autonomous robot on a test field with two engineers holding a laptop and a remote."),
  S("opp-product", "Opportunity: learning product", 960, 640, "Opportunity card", "A modern learning product workspace with designers and a student test session", "none",
    "A bright studio with a design wall of learning-app screens and a student testing a tablet while a designer observes."),
  S("founders", "For founders", 1400, 1000, "For founders page hero", "A founder reviewing an AI-generated team plan with role cards and skill gaps", "left",
    "A founder at a desk reviewing a team plan on a large monitor: role cards, skill coverage bars and a gap marker. Notebook, coffee, a prototype sketch."),
  S("builders", "For builders", 1400, 1000, "For builders page hero", "A builder presenting a portfolio of shipped projects to a small group", "left",
    "A builder presenting three shipped projects (app, device, dashboard) on a screen to a small group. Proof-of-work tags beside each."),
  S("pricing", "Pricing", 1400, 700, "Pricing page header", "A small team choosing a plan together around a laptop", "left",
    "Three people reviewing plan cards on a laptop, simple and calm. No price text."),
  S("about", "About VIGO Tech", 1400, 900, "About page", "The VIGO Tech team collaborating in a studio", "right",
    "A small studio team working around a long table with laptops, hardware prototypes and printed wireframes."),
  S("auth-side", "Sign-in side panel", 1000, 1400, "Login and signup side panel (dark)", "Abstract connected profile cards on a dark background", "none",
    "Dark navy background with several glass profile cards connected by thin icy-blue lines, one small vermilion highlight. Portrait orientation."),
  S("onboarding", "Onboarding welcome", 1200, 900, "Onboarding first step", "A builder waving hello next to a profile checklist", "none",
    "A friendly builder next to a simple profile checklist with ticks (skills, project, availability)."),
  S("empty-discover", "Empty: feed", 800, 600, "Empty states", "Two people sharing a link between laptops", "none",
    "Two people exchanging a link card between two laptops, minimal background."),
  S("empty-cart", "Empty: squad cart", 800, 600, "Empty states", "An empty squad board with four open role slots", "none",
    "An empty team board with four dotted role slots and a magnifier hovering over one."),
  S("empty-messages", "Empty: messages", 800, 600, "Empty states", "A quiet chat window with a waving hand", "none",
    "A simple chat window with a single waving hand icon and two empty message bubbles."),
  S("empty-projects", "Empty: projects", 800, 600, "Empty states", "A blank project board with a flag and a pencil", "none",
    "A blank kanban board with three empty columns and a small flag on the first."),
  S("not-found", "404", 1000, 700, "Not found page", "A lost builder holding a map with a missing piece", "none",
    "A builder holding a paper map with one puzzle-shaped hole, looking around a clean room."),
  S("og-default", "Social share image", 1200, 630, "Default Open Graph image (1200x630)", "Skilion: People x Skills x Proof of Work", "left",
    "Wide composition for social sharing: a group of builders around a project board on the right, left half calm for a headline. Dark navy ground with icy-blue light."),
];
export const SLOT_MAP = Object.fromEntries(SLOTS.map((s) => [s.id, s])) as Record<string, Slot>;

/** Shared style block. Paste it before every scene so the whole set looks like one hand drew it. */
export const STYLE_LOCK =
  "Skilion illustration style: modern editorial flat-vector illustration with soft layered depth, the kind of art a premium product brand commissions (not clip art, not stock). Clean geometric shapes, one consistent line weight, believable adult proportions, natural varied poses, diverse people in contemporary everyday clothes. Palette strictly: icy blue #65C7F3, deep blue #159BD4, navy #0B1422, near-black #080B10, white and very pale blue #F3FAFE, and one small vermilion #F0441E accent used once per image on a single meaningful action. Soft top-left light, subtle ice-blue gradients inside shapes, frosted-glass panels only where they depict real interface elements. Very fine grain, crisp edges. No text, no letters, no logos, no watermarks.";
export const NEGATIVE =
  "purple, pink, magenta, neon gradients, glossy 3D plastic blobs, floating abstract orbs, photorealism, stock-photo look, glowing sci-fi holograms, robots, brains, lightbulbs, rocket ships, handshakes over globes, distorted hands, extra fingers, warped faces, gibberish text, thick black outlines";

/** "clear" art sits straight on the page, so it needs a transparent background. "filled" art is shown inside a card or full width, so it keeps its own background. */
export const BG_MODE: Record<string, "clear" | "filled" | "navy"> = {
  hero: "clear", "after-hours": "clear", global: "clear", founders: "clear", builders: "clear", pricing: "clear", about: "clear", onboarding: "clear", "not-found": "clear",
  "empty-discover": "clear", "empty-cart": "clear", "empty-messages": "clear", "empty-projects": "clear",
  "goal-validate": "filled", "goal-prototype": "filled", "goal-help": "filled", "goal-company": "filled",
  "method-profile": "filled", "method-discover": "filled", "method-squad": "filled", "method-workspace": "filled",
  "opp-research": "filled", "opp-robotics": "filled", "opp-product": "filled", "og-default": "filled", "auth-side": "navy",
};
export const BG_TEXT = {
  clear: "Background: fully transparent PNG, subject only, no backdrop, no ground plane shadow bleeding to the edges.",
  filled: "Background: flat very pale blue #F3FAFE filling the whole frame, no vignette.",
  navy: "Background: flat deep navy #0B1422 filling the whole frame, light-coloured linework so it reads on dark.",
} as const;

export const BRAND_TEMPLATE = (s: Slot) =>
  `${STYLE_LOCK} Scene: ${s.scene} ${s.clear === "none" ? "Centered composition." : `Keep the ${s.clear} third of the frame calm and uncluttered so page copy can sit there.`} ${BG_TEXT[BG_MODE[s.id] || "filled"]} Aspect ratio ${s.w}:${s.h}. Avoid: ${NEGATIVE}.`;
