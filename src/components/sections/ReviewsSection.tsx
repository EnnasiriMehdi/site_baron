import { siteConfig } from "@/config/site";
import { googleReviews } from "@/content/home";
import { IconGoogleLogo, IconQuote, IconStar } from "@/components/ui/icons";

const MAX_DISPLAYED = 5;

/*
 * Structure inspirée d'une maquette de référence du client (badge de note, cartes, étoiles).
 * Avis réels, copiés tels quels depuis la fiche Google de l'établissement (content/home.ts) —
 * jamais de contenu inventé (CLAUDE.md, 7bis.4). Si de nouveaux avis arrivent, les ajouter de la
 * même façon : copier-coller, jamais reformuler ni inventer.
 *
 * Affichage plafonné à 5 avis (décision du client) : au-delà, on renvoie vers la fiche Google
 * plutôt que d'allonger indéfiniment la page.
 */
export function ReviewsSection() {
  const displayedReviews = googleReviews.reviews.slice(0, MAX_DISPLAYED);
  const hasMore = googleReviews.reviews.length > MAX_DISPLAYED;

  return (
    <section id="avis" aria-labelledby="avis-title" className="scroll-mt-28 bg-(--color-surface-muted) py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <h2 id="avis-title" className="text-2xl font-extrabold sm:text-3xl">
            Ils nous ont fait confiance
          </h2>

          {/* Badge de note façon widget Google : logo réel, note et nombre d'avis réels, lien vers la fiche. */}
          <a
            href={siteConfig.googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-(--color-surface) px-5 py-3 shadow-sm"
          >
            <IconGoogleLogo className="h-8 w-8 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold leading-none">{googleReviews.rating}</span>
                <div className="flex gap-0.5 text-(--color-accent)" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar key={i} className="h-4 w-4" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-(--color-text-muted)">{googleReviews.reviewCount} avis Google</p>
            </div>
          </a>
        </div>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedReviews.map((review, index) => (
            <li
              key={index}
              className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-(--color-surface) p-6 shadow-sm"
            >
              <IconQuote className="absolute -right-2 -top-2 h-20 w-20 text-(--color-primary-soft)" />
              <div className="relative flex gap-1 text-(--color-accent)" aria-label="5 étoiles">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <IconStar key={starIndex} className="h-5 w-5" />
                ))}
              </div>
              <blockquote className="relative text-(--color-text)">{review.quote}</blockquote>
              <div className="relative mt-auto flex items-center gap-3 border-t border-(--color-border) pt-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-primary-soft) text-sm font-bold text-(--color-primary)"
                >
                  {review.author.charAt(0)}
                </span>
                <p className="text-sm text-(--color-text-muted)">
                  {review.author}
                  <span className="block text-xs">{review.visited}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        {hasMore && (
          <div className="mt-8 text-center">
            <a
              href={siteConfig.googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-md) border border-(--color-primary) px-6 py-3 font-semibold text-(--color-primary)"
            >
              Voir tous les avis sur Google
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
