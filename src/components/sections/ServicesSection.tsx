import { siteConfig } from "@/config/site";
import { IconDroplet, IconFlame, IconSnowflake } from "@/components/ui/icons";

// Une icône et un dégradé par métier (toujours composés à partir des tokens, jamais une couleur en dur).
const serviceStyles = [
  { Icon: IconFlame, background: "linear-gradient(105deg, var(--color-accent) 0%, var(--color-accent) 72%, var(--color-primary) 100%)" },
  { Icon: IconSnowflake, background: "linear-gradient(105deg, var(--color-primary) 0%, var(--color-primary) 72%, var(--color-accent) 100%)" },
  { Icon: IconDroplet, background: "linear-gradient(105deg, var(--color-text) 0%, var(--color-text) 72%, var(--color-primary) 100%)" },
] as const;

export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-28 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="services-title" className="text-2xl font-extrabold sm:text-3xl">
          Trois métiers, un seul numéro.
        </h2>
        <p className="mt-3 max-w-2xl text-base text-(--color-text-muted)">
          Trois métiers, une même règle : on diagnostique avant d&apos;annoncer un prix, et le prix annoncé
          est celui de la facture.
        </p>
        <div className="mt-8 flex flex-col gap-5">
          {siteConfig.services.map((service, index) => {
            const { Icon, background } = serviceStyles[index];
            return (
              <article
                key={service.slug}
                style={{ backgroundImage: background }}
                className="flex flex-col items-start gap-6 rounded-3xl p-8 text-(--color-primary-contrast) sm:flex-row sm:items-center"
              >
                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-(--color-surface)">
                  <Icon className="h-8 w-8 text-(--color-text)" />
                </span>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{service.title}</h3>
                  <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-(--color-primary-contrast)/90">
                    {service.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#contact"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-(--color-surface) px-6 py-3 font-semibold text-(--color-text)"
                >
                  Devis {service.title.toLowerCase()}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
