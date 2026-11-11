import { siteConfig } from "@/config/site";
import { IconBadge } from "@/components/ui/IconBadge";
import { IconMapPin } from "@/components/ui/icons";

export function ZonesSection() {
  return (
    <section id="zones" aria-labelledby="zones-title" className="scroll-mt-28 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <IconBadge>
          <IconMapPin className="h-full w-full" />
        </IconBadge>
        <h2 id="zones-title" className="mt-4 text-2xl font-extrabold sm:text-3xl">
          Nos zones d&apos;intervention
        </h2>
        <p className="mt-3 max-w-2xl text-base text-(--color-text-muted)">
          Nous intervenons à Cannes, Antibes, Nice et dans les communes alentours. En cas de doute sur
          votre adresse, appelez-nous : c&apos;est plus rapide qu&apos;un formulaire.
        </p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {siteConfig.areas.map((area) => (
            <li
              key={area}
              className="rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm"
            >
              {area}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
