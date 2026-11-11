import { MobileCallBar } from "@/components/sections/MobileCallBar";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";

// Même header/footer/barre d'appel que la page d'accueil et le blog (voir src/app/blog/layout.tsx) :
// page.tsx ne compose pas ces éléments ici, il n'y a pas de layout partagé plus haut.
export default function RealisationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <MobileCallBar />
    </>
  );
}
