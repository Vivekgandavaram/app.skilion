import type { DOMAINS } from "@/lib/types";

type Domain = (typeof DOMAINS)[number];

/** Each main area has sub-areas; each sub-area lists the skill tags suggested for it. */
export const TAXONOMY: Record<Domain, Record<string, string[]>> = {
  Design: {
    "UX & Product Design": ["UX Design", "User Research", "Prototyping", "Figma", "Design Systems", "Product Design"],
    "UI & Visual Design": ["UI Design", "Figma", "Design Systems", "Brand Design", "Illustration"],
    "Brand & Graphic": ["Brand Design", "Illustration", "Photography", "Copywriting"],
    "Motion & Video": ["Motion Design", "Video Editing", "Illustration"],
    "Industrial & Hardware Design": ["CAD", "3D Printing", "Mechanical Design", "Product Design"],
  },
  Engineering: {
    "Frontend": ["React", "Next.js", "TypeScript", "JavaScript"],
    "Backend": ["Node.js", "Python", "Go", "Java", "PostgreSQL", "MongoDB", "Redis", "GraphQL"],
    "Mobile": ["Flutter", "React Native", "Swift", "Kotlin"],
    "DevOps & Cloud": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
    "Embedded & Hardware": ["Embedded Systems", "IoT", "Robotics", "ROS 2", "PCB Design", "Arduino", "Raspberry Pi", "FPGA", "Electronics", "C++"],
    "Security & QA": ["Security", "Penetration Testing", "Test Automation"],
  },
  "AI / ML": {
    "Machine Learning": ["Machine Learning", "Deep Learning", "Statistics", "Python"],
    "LLMs & Generative AI": ["LLMs", "Generative AI", "Natural Language Processing", "Prompt Engineering"],
    "Computer Vision": ["Computer Vision", "Deep Learning", "Python"],
    "Data Science & Analytics": ["Data Science", "Data Analysis", "SQL", "Power BI", "Statistics"],
    "Data Engineering": ["Data Engineering", "SQL", "Python", "ETL"],
  },
  "Product & Strategy": {
    "Product Management": ["Product Management", "Product Strategy", "Roadmapping", "Agile"],
    "Customer Discovery & Research": ["Customer Discovery", "Market Research", "User Research"],
    "Startup & Fundraising": ["Startup Strategy", "Fundraising", "Business Analysis"],
    "Project Management": ["Project Management", "Agile"],
  },
  Marketing: {
    "Growth & Performance": ["Growth Marketing", "Performance Marketing", "Analytics"],
    "Content & SEO": ["SEO", "Content Marketing", "Copywriting"],
    "Social & Community": ["Social Media", "Community Building"],
    "Email & Lifecycle": ["Email Marketing", "Copywriting", "Analytics"],
    "Sales & Partnerships": ["Sales", "Partnerships"],
  },
  Finance: {
    "Financial Modelling": ["Financial Modelling", "Unit Economics", "Budgeting"],
    "Accounting & Tax": ["Accounting", "Budgeting", "Compliance"],
    "Pricing & Monetisation": ["Pricing", "Unit Economics"],
    "Legal & Compliance": ["Legal Basics", "Compliance"],
  },
  Operations: {
    "Operations & Supply Chain": ["Operations", "Supply Chain"],
    "Customer Support & Success": ["Customer Support"],
    "People & Hiring": ["Hiring"],
    "Teaching & Training": ["Teaching", "Public Speaking"],
  },
};

export const subdomainsOf = (d?: string): string[] => (d && (TAXONOMY as Record<string, Record<string, string[]>>)[d] ? Object.keys((TAXONOMY as Record<string, Record<string, string[]>>)[d]) : []);
export const ALL_SUBDOMAINS = Object.values(TAXONOMY).flatMap((m) => Object.keys(m));
export const skillsFor = (d?: string, sub?: string): string[] => {
  const t = (TAXONOMY as Record<string, Record<string, string[]>>)[d || ""];
  if (!t) return [];
  return sub && t[sub] ? t[sub] : [...new Set(Object.values(t).flat())];
};
