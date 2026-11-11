import { steps } from "@/content/home";

export function HowItWorksSection() {
  return (
    <section aria-labelledby="how-it-works-title" className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="how-it-works-title" className="text-2xl font-extrabold sm:text-3xl">
          Ce qui se passe après votre appel
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative rounded-(--radius-lg) border border-(--color-border) p-6">
              <span
                aria-hidden="true"
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--color-primary) font-bold text-(--color-primary-contrast)"
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-(--color-text-muted)">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
