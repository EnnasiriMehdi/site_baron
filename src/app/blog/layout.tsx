import { MobileCallBar } from "@/components/sections/MobileCallBar";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";

// Même header/footer/barre d'appel que la page d'accueil (page.tsx compose les siens directement,
// il n'y a pas de layout partagé plus haut) : évite de les dupliquer dans chaque page du blog.
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <MobileCallBar />
    </>
  );
}
