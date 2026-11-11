import Image from "next/image";

import { siteConfig } from "@/config/site";
import { trustPoints } from "@/content/home";
import { IconBadge } from "@/components/ui/IconBadge";
import { IconClock, IconEuro, IconShieldCheck, IconWrench } from "@/components/ui/icons";

// Une icône par argument, dans l'ordre de content/home.ts (prix, expérience, délai, assurance).
const icons = [IconEuro, IconWrench, IconClock, IconShieldCheck] as const;

export function WhyUsSection() {
  return (
    <section id="pourquoi" aria-labelledby="pourquoi-title" className="scroll-mt-28 bg-(--color-surface-muted) py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="pourquoi-title" className="text-2xl font-extrabold sm:text-3xl">
          Pourquoi nous faire confiance
        </h2>
        <div className="relative mt-6 h-40 w-full overflow-hidden rounded-(--radius-lg)">
          <Image
            src="/images/technicien-chaudiere-moderne.png"
            alt={`Technicien ${siteConfig.name} au travail sur une chaudière`}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, index) => {
            const Icon = icons[index];
            return (
              <li
                key={point.title}
                className="flex flex-col gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6"
              >
                <IconBadge>
                  <Icon className="h-full w-full" />
                </IconBadge>
                <h3 className="font-semibold">{point.title}</h3>
                <p className="text-base text-(--color-text-muted)">{point.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
