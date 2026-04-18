import Hero from "@/components/sections/Hero";
import Mission from "@/components/sections/Mission";
import Infrastructure from "@/components/sections/Infrastructure";
import TechMarquee from "@/components/sections/TechMarquee";
import CTA from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <TechMarquee />
      <Mission />
      <Infrastructure />
      <CTA />
    </>
  );
}
