import { situations } from "@/content/home";
import { IconBadge } from "@/components/ui/IconBadge";
import { IconAlertTriangle, IconClock, IconRefresh, IconWrench } from "@/components/ui/icons";

// Une icône par situation, dans l'ordre de content/home.ts (urgent, récurrent, à remplacer, prévention).
const icons = [IconAlertTriangle, IconRefresh, IconWrench, IconClock] as const;

export function SituationsSection() {
  return (
    <section id="besoins" aria-labelledby="besoins-title" className="scroll-mt-28 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="besoins-title" className="text-2xl font-extrabold sm:text-3xl">
          Quelle que soit la situation, on sait quoi faire
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {situations.map((situation, index) => {
            const Icon = icons[index];
            return (
              <li
                key={situation.title}
                className="flex flex-col gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6"
              >
                <IconBadge tone={index === 0 ? "accent" : "primary"}>
                  <Icon className="h-full w-full" />
                </IconBadge>
                <h3 className="text-lg font-semibold">{situation.title}</h3>
                <p className="flex-1 text-base text-(--color-text-muted)">{situation.description}</p>
                <a href={situation.anchor} className="text-sm font-semibold text-(--color-primary) underline">
                  {situation.ctaLabel}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
