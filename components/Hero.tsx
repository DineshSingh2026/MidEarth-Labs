import AgentNetwork from "./AgentNetwork";
import LaunchButton from "./LaunchButton";

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh w-full flex-col items-center justify-center overflow-hidden px-6 py-[clamp(2.5rem,6vh,5.5rem)]"
    >
      <div
        data-hero-type
        className="relative z-10 flex w-full max-w-[54rem] flex-col items-center text-center"
      >
        <p
          className="t-eyebrow rise flex items-center gap-2.5"
          style={{ animationDelay: "400ms" }}
        >
          <span className="pip" aria-hidden="true" />
          AUTONOMOUS AI
        </p>

        <h1
          id="hero-title"
          className="t-headline rise mt-6"
          style={{ animationDelay: "490ms" }}
        >
          Build Your Own Team of{" "}
          <span className="warm">Autonomous AI Agents</span>
        </h1>

        <p className="t-sub rise mt-7" style={{ animationDelay: "580ms" }}>
          Connect your agents, use your preferred infrastructure and AI models, and
          let them collaborate and automate tasks, all from one powerful chat
          experience.
        </p>

        <div className="mt-12">
          <LaunchButton />
        </div>
      </div>

      {/*
        Last in the DOM so it sits below the CTA in the mobile flow; on sm+ it
        becomes absolute and drops behind the type. aria-hidden throughout.
      */}
      <AgentNetwork />
    </section>
  );
}
