import CinematicLanding from "../components/landing/CinematicLanding";
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* Cinematic Scroll Experience */}
      <CinematicLanding />
    </main>
  );
}
