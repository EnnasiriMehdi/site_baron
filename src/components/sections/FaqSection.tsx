import { faq } from "@/content/faq";
import { IconBadge } from "@/components/ui/IconBadge";
import { IconHelpCircle } from "@/components/ui/icons";

// Accordéon en HTML natif <details>/<summary> : zéro JavaScript, nativement accessible au
// clavier et aux lecteurs d'écran (CLAUDE.md, section 6.4 — zéro JS par défaut).
export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-28 bg-(--color-surface-muted) py-14 sm:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <IconBadge>
          <IconHelpCircle className="h-full w-full" />
        </IconBadge>
        <h2 id="faq-title" className="mt-4 text-2xl font-extrabold sm:text-3xl">
          Questions fréquentes
        </h2>
        <div className="mt-6 flex flex-col gap-3">
          {faq.map((item) => (
            <details
              key={item.question}
              className="group rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-(--color-text)">
                {item.question}
                <span aria-hidden="true" className="shrink-0 text-(--color-primary) group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-base text-(--color-text-muted)">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
