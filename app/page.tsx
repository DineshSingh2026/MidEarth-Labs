import BackgroundField from "@/components/BackgroundField";
import Hero from "@/components/Hero";
import Integrations from "@/components/Integrations";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function Page() {
  return (
    <>
      <BackgroundField />
      <SiteHeader />
      <main className="relative flex w-full flex-col items-center">
        <Hero />
        <Integrations />
      </main>
      <SiteFooter />
    </>
  );
}
