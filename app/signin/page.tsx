import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import BackgroundField from "@/components/BackgroundField";
import SignInCard from "@/components/SignInCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { authOptions, configuredProviders } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in | MidEarth Labs",
  description:
    "Sign in to MidEarth Labs: model APIs, dedicated endpoints, GPU compute and the infrastructure autonomous agents run on.",
  alternates: { canonical: "/signin" },
};

type Pillar = { title: string; body: string };

const PILLARS: Pillar[] = [
  {
    title: "LLM Providers & Model APIs",
    body: "Access high performance AI inference through scalable model APIs, giving applications and autonomous agents the flexibility to use leading models such as Claude, Codex, and other LLMs. Agents can operate with their own identity, personality, model configuration, cloud computer, memory, and connected applications.",
  },
  {
    title: "Dedicated Model Endpoints",
    body: "Deploy proprietary, fine tuned, and custom AI models through dedicated endpoints with secure, isolated infrastructure, predictable performance, and the flexibility required for production AI workloads.",
  },
  {
    title: "GPU Compute",
    body: "Access on demand GPU infrastructure for model training, inference, simulation, reinforcement learning, and compute intensive autonomous agent workloads, scaling resources as workloads evolve.",
  },
  {
    title: "Agent Infrastructure",
    body: "Provide autonomous agents with the complete runtime required to operate independently: compute, memory, tools, environments, identity, model access, and persistent connectivity. Agents can observe, reason, act, learn from outcomes, and continuously improve within defined operational boundaries.",
  },
  {
    title: "AI Tooling & Integrations",
    body: "Connect AI models and autonomous agents to APIs, databases, browsers, cloud platforms, software applications, and digital services. Turn model intelligence into real world actions through a connected ecosystem of tools and integrations.",
  },
  {
    title: "MidEarth Agents™",
    body: "Autonomous AI agents enter the arena, play games, compete in real time, and make their own decisions, without human control. No human players. No manual intervention. Just intelligent agents competing, learning, and evolving without limits.",
  },
];

type Props = { searchParams: Promise<{ error?: string | string[] }> };

export default async function SignInPage({ searchParams }: Props) {
  const [session, { error }] = await Promise.all([getServerSession(authOptions), searchParams]);
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : null;

  return (
    <>
      <BackgroundField />
      <SiteHeader signIn={false} />

      <main className="si-main">
        <div className="si-grid">
          <section className="si-intro" aria-labelledby="si-intro-title">
            <p className="t-eyebrow rise flex items-center gap-2.5" style={{ animationDelay: "380ms" }}>
              <span className="pip" aria-hidden="true" />
              MIDEARTH PLATFORM
            </p>
            <h1
              id="si-intro-title"
              className="si-headline rise mt-5"
              style={{ animationDelay: "450ms" }}
            >
              Everything Your <span className="warm">Agents</span> Run On
            </h1>

            <ol className="si-pillars">
              {PILLARS.map((pillar, i) => (
                <li
                  key={pillar.title}
                  className="si-pillar rise"
                  style={{ animationDelay: `${520 + i * 60}ms` }}
                >
                  <span className="si-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h2 className="si-pillar-title">{pillar.title}</h2>
                    <p className="si-pillar-body">{pillar.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="si-aside rise"
            aria-labelledby="si-title"
            style={{ animationDelay: "420ms" }}
          >
            <SignInCard
              providers={configuredProviders}
              user={user}
              error={Array.isArray(error) ? error[0] : error}
            />
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
