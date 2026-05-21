import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";

const modules = [
  {
    title: "Reading",
    description: "Continue your reading streak, open the next challenge, and track comprehension progress.",
    href: "/reading",
    tag: "Core learning",
  },
  {
    title: "Forums",
    description: "Discuss reading takeaways, share ideas, and participate in community threads.",
    href: "/forums",
    tag: "Community",
  },
  {
    title: "Achievement",
    description: "Review unlocked milestones, current missions, and motivation loops.",
    href: "/achievement",
    tag: "Gamification",
  },
  {
    title: "Clan",
    description: "Jump into social competition, rankings, and collaborative progression.",
    href: "/clan",
    tag: "Social",
  },
];

export function ModuleNavigationGrid() {
  const { isAdmin } = useAuth();

  return (
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your modules</p>
            <h2>Pick up where you want to continue</h2>
          </div>
          <p className="muted-copy">
            Card-based navigation keeps the next action obvious whether you are on
            desktop or mobile.
          </p>
        </div>

        <div className="module-grid">
          {modules.map((module) => {
            let href = module.href;

            if (module.title === "Reading") {
              href = isAdmin
                  ? "/reading/admin"
                  : "/reading/student/readings";
            }

            if (module.title === "Achievement") {
              href = isAdmin
                  ? "/achievement/admin"
                  : "/achievement/student";
            }

            return (
                <Link key={module.title} href={href} className="module-card">
                  <span className="module-tag">{module.tag}</span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <span className="module-link">Open module</span>
                </Link>
            );
          })}
        </div>
      </section>
  );
}
