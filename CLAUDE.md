# CLAUDE.md — Site vitrine d'urgence (plombier, serrurier, dépannage…)

Ce fichier définit les règles que Claude Code doit suivre dans ce projet.
Il est prioritaire sur les habitudes par défaut. En cas de doute, applique la règle la plus stricte.

---

## 1. Contexte du projet

- **Nature** : site vitrine pour des professionnels de l'urgence (plomberie, serrurerie, dépannage…).
- **Objectifs** :
  1. Être trouvé rapidement sur Google (SEO local et national).
  2. Convertir l'urgence en appel ou demande de devis en moins de 3 actions.
  3. Être très rapide et accessible à tous les utilisateurs.
- **Fonctionnalités** :
  - Pages vitrine (services, zones d'intervention, à propos, mentions légales, RGPD).
  - Formulaire de contact / demande d'intervention.
  - Portail admin sécurisé (consultation et traitement des demandes).
  - Envoi d'emails (confirmation client, notification admin, relances).
  - Relances automatiques planifiées (demandes non traitées, devis en attente).
  - Articles de blog créés par l'admin, pour le SEO (conseils, guides de dépannage, actualités locales).
- **Langue** : interface et contenus en **français** (`lang="fr"`). Les identifiants de code (variables, fonctions, fichiers) restent en **anglais**.

---

## 2. Stack imposée

| Domaine | Choix | Raison |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript strict** | SSR/SSG natif pour le SEO, `next/image`, Metadata API, sitemap/robots, Server Actions pour le formulaire, un seul déploiement |
| UI | React Server Components par défaut, Tailwind CSS | Moins de JavaScript envoyé au navigateur = meilleures métriques |
| Validation | **Zod** (frontières : formulaires, Server Actions, route handlers, variables d'env) | Une source de vérité pour les schémas |
| Base de données | **Drizzle ORM + SQLite** (fichier unique, mode WAL) | Léger, typé, aucun serveur à administrer ; largement suffisant pour quelques milliers de demandes et un admin mono-instance |
| Hébergement | **VPS OVH (France/UE)**, Node en process géré (systemd ou PM2), reverse proxy HTTPS (Caddy ou Nginx) | Maîtrise des données et de l'emplacement pour le RGPD |
| Auth admin | **Auth.js** (credentials) ou session maison (`jose` + cookies HttpOnly), mots de passe hachés avec **argon2** | Sécurité éprouvée, pas de crypto maison |
| Emails | Adaptateur `Mailer` (Resend ou SMTP via Nodemailer) | Interchangeable (DIP) |
| Relances | Route handler protégée par secret, déclenchée par le cron système du VPS (`crontab`) | Pas de process permanent inutile |
| Tests | **Vitest** (unitaires), **Testing Library** (composants), **Playwright** (E2E + **axe-core** pour l'accessibilité) | Couverture des trois niveaux |
| Qualité | ESLint (config Next + `jsx-a11y`), Prettier, `tsc --noEmit`, Lighthouse CI | Contrôle automatisé des règles ci-dessous |

**Ne pas ajouter de dépendance sans demander d'abord.** Pour chaque ajout : dire ce qui sera installé, pourquoi, et l'impact sur le bundle.

> NestJS n'est **pas** retenu : le projet est un site unique à rendu serveur, un backend séparé n'apporterait que de la complexité. Ne pas introduire de couche NestJS sans décision explicite.

---

## 3. Architecture

### 3.1 Arborescence

```
src/
  app/                      # Routage uniquement : pages, layouts, metadata, route handlers
    (site)/                 # Pages publiques
      page.tsx
      services/[slug]/page.tsx
      zones/[city]/page.tsx
      contact/page.tsx
      mentions-legales/page.tsx
      blog/page.tsx           # Liste des articles publiés
      blog/[slug]/page.tsx    # Article
    (admin)/admin/          # Portail protégé (layout qui vérifie la session)
    api/                    # Route handlers (ex. cron des relances, webhooks)
    sitemap.ts
    robots.ts
    layout.tsx
  components/
    ui/                     # Composants génériques, sans logique métier (Button, Input…)
    sections/               # Blocs de pages (Hero, ServicesGrid, FaqList…)
  features/                 # Domaines métier, isolés
    contact/
      components/
      actions.ts            # Server Action (fine : valide, appelle le service)
      schema.ts             # Schéma Zod
      service.ts            # Logique métier
      index.ts              # API publique du module
    leads/                  # Demandes d'intervention (lecture/traitement admin)
    admin-auth/             # Connexion, session, déconnexion
    articles/               # Blog : CRUD admin, rendu public, données structurées
    realisations/           # Portfolio de chantiers terminés, admin-éditable (pas de brouillon/publié)
    notifications/          # Emails et relances
  lib/                      # Infrastructure et utilitaires transverses
    db/
      index.ts              # Connexion SQLite (singleton, PRAGMA WAL et foreign_keys), `import "server-only"`
      schema.ts             # Schéma Drizzle
      migrations/           # Migrations générées par drizzle-kit, versionnées
    env.ts                  # Variables d'env validées par Zod au démarrage
    logger.ts
    mailer/                 # Interface Mailer + adaptateurs
    rate-limit.ts
  content/                  # Contenus éditoriaux (services, zones, FAQ) — données, pas de logique
  config/
    site.ts                 # Nom, téléphone, adresse, zones, horaires : source unique
data/                       # Fichier SQLite (hors Git, hors dossier public)
tests/
  unit/  integration/  e2e/
```

> **Divergence assumée avec le schéma ci-dessus** : le code réel n'utilise pas de groupe de routes
> `(site)` (`page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `realisations/page.tsx` vivent
> directement sous `app/`), ni de groupe `(admin)` autour de `admin/` (c'est `app/admin/(protected)/`
> qui porte la vérification de session). Suivre l'arborescence réelle du code, pas ce diagramme, en
> cas d'écart. `app/blog/layout.tsx` et `app/realisations/layout.tsx` composent chacun
> Header/Footer/MobileCallBar (identiques), car aucun layout partagé n'existe au-dessus d'eux.

`public/uploads/` (hors de ce schéma, car hors `src/`) : photos publiques gérées par l'admin
(réalisations, couverture d'article — `lib/public-image-upload.ts`), servies en chemin statique pour
que `next/image` les optimise sans configuration supplémentaire. À la différence de `data/uploads/`
(pièces jointes **privées** des leads, jamais publiques), ces images sont volontairement publiques.
Exclu de Git (`.gitignore`) mais à inclure dans la sauvegarde du VPS au même titre que `data/`
(section 8.4) : ce n'est pas versionné, donc perdu si non sauvegardé séparément.

### 3.2 Règles de dépendance

- `app/` **orchestre** : il importe depuis `features/` et `components/`, jamais l'inverse.
- `features/*` ne s'importent **pas entre eux** directement. Passer par leur `index.ts` ou par une interface partagée.
- `lib/` ne dépend ni de `features/` ni de `app/`.
- `components/ui` ne contient **aucune** logique métier ni appel réseau.
- Les `page.tsx` et `layout.tsx` restent **fins** : composition de sections et de données, pas de logique.
- Les contenus (services, zones, textes) vivent dans `content/` ou `config/`, jamais en dur dans les composants.

---

## 4. Principes de code (SOLID, KISS, DRY, YAGNI)

### SOLID appliqué à Next.js
- **S — Responsabilité unique** : une Server Action valide et délègue ; un `service.ts` contient la règle métier ; un adaptateur parle à l'extérieur (DB, email). Un fichier = une responsabilité.
- **O — Ouvert/fermé** : ajouter un canal de notification = ajouter un adaptateur, sans modifier le service existant (ex. `EmailNotifier`, `SmsNotifier` implémentent `Notifier`).
- **L — Substitution de Liskov** : toute implémentation de `Mailer` ou `LeadRepository` se comporte comme l'interface décrit (même erreurs typées, mêmes garanties).
- **I — Ségrégation des interfaces** : interfaces petites et ciblées (`LeadReader`, `LeadWriter`) plutôt qu'un gros `Repository` fourre-tout.
- **D — Inversion des dépendances** : `features/*/service.ts` dépend d'une **interface** (`Mailer`, `LeadRepository`). L'implémentation concrète (Prisma, Resend) est injectée dans `lib/` au point d'entrée. Les tests injectent des doubles.

### Autres principes
- **KISS** : la solution la plus simple qui fonctionne. Pas d'abstraction "au cas où".
- **DRY** : factoriser à partir de la **3e** répétition réelle, pas avant. Ne pas fusionner deux codes qui ne divergent que par coïncidence.
- **YAGNI** : ne pas construire de fonctionnalité non demandée (multi-langue, multi-tenant, paiement en ligne…) sans demande explicite.
- **Loi de Déméter** : éviter les chaînes `a.b.c.d` ; exposer des méthodes ciblées.
- **Fonctions courtes** : viser < 30 lignes, paramètres ≤ 3 (sinon objet nommé).
- **Pas de magie** : pas de `any`, pas d'assertion non nulle `!` sans commentaire justifiant, pas de `// @ts-ignore` (utiliser `@ts-expect-error` avec explication si vraiment inévitable).

### Conventions TypeScript / React / Next
- `strict: true`, `noUncheckedIndexedAccess: true`.
- **Server Components par défaut.** `"use client"` uniquement sur les feuilles interactives (formulaire, menu mobile, carrousel). Le remonter le moins haut possible dans l'arbre.
- **Server Actions** : toujours valider l'entrée avec Zod, retourner un résultat typé `{ ok: true, data } | { ok: false, error }`, ne jamais exposer les erreurs internes.
- **Frontière serveur/client** :
  - Tout module qui touche à la base (`lib/db/`), aux secrets (`lib/env.ts`), aux emails (`lib/mailer/`), aux sessions ou aux fichiers serveur commence par `import "server-only";`. Si un Client Component l'importe, le build échoue.
  - Ce contrôle est déclaré dans ESLint (`no-restricted-imports`) : interdire l'import de `lib/db`, `lib/env`, `lib/mailer` et `features/*/service` depuis tout fichier marqué `"use client"`, ainsi que de `process.env` hors de `lib/env.ts`.
  - `"use client"` reste le plus bas possible dans l'arbre. Les données passent des Server Components aux Client Components uniquement par `props` sérialisables ou `children`.
  - Les Providers (thème, contexte) vivent dans un wrapper client dédié, appelé depuis le layout serveur.
  - Aucune récupération de données dans un `useEffect` : le chargement se fait dans les Server Components.
- **Erreurs** : erreurs métier typées (classes ou union), journalisées côté serveur, messages utilisateur génériques et en français.
- **Variables d'environnement** : lues **uniquement** via `lib/env.ts` (validation Zod au démarrage). Jamais `process.env.X` dispersé dans le code.
- **Nommage** : composants `PascalCase`, hooks `useXxx`, fichiers composants `PascalCase.tsx`, autres fichiers `kebab-case.ts`, constantes `SCREAMING_SNAKE_CASE` seulement pour les vraies constantes globales.
- **Exports** : exports nommés (pas d'`export default`, sauf pages et layouts imposés par Next).
- **Commentaires** : expliquer le **pourquoi**, pas le **quoi**. Pas de commentaire qui répète le code.

---

## 5. SEO — règles obligatoires

### 5.1 Métadonnées et structure
- **Chaque page** exporte `metadata` ou `generateMetadata` avec : `title` unique (≤ 60 caractères), `description` unique (≤ 155 caractères), `alternates.canonical`, Open Graph et Twitter cards.
- **Une seule balise `<h1>` par page**, hiérarchie `h1 > h2 > h3` sans saut.
- HTML sémantique : `<header>`, `<nav>`, `<main>`, `<section>` (avec titre), `<article>`, `<footer>`. Pas de `<div>` cliquable.
- Liens internes descriptifs (« Dépannage plomberie à Lyon », jamais « cliquez ici »).
- URLs propres, lisibles, en minuscules, avec tirets : `/services/depannage-plomberie/`, `/zones/lyon/`.
- Pages **non indexables** (admin, merci, erreurs) : `robots: { index: false, follow: false }` + exclusion dans `robots.ts`.

### 5.2 SEO local (cœur du métier)
- **Données structurées JSON-LD** sur la home et les pages services/zones, en utilisant le sous-type précis (`Plumber`, `Locksmith`, `Electrician`, `HVACBusiness`…) : nom, adresse, téléphone, `geo`, `openingHoursSpecification`, `areaServed`, `priceRange` si pertinent.
- Si le service est disponible 24h/24 : `openingHours` explicite (`Mo-Su 00:00-23:59`) et le mentionner dans le texte.
- **Une page par couple service × zone** lorsque le contenu est réellement différent (pas de pages dupliquées avec un seul mot changé : risque de contenu dupliqué).
- **NAP cohérent** (Nom, Adresse, Téléphone) strictement identique sur le site, le footer, les données structurées et la fiche Google Business Profile. Toujours le lire depuis `config/site.ts`.
- Téléphone cliquable (`<a href="tel:+33…">`) visible dans le header **sur mobile**, dès le premier écran.

### 5.3 Indexation et technique
- `app/sitemap.ts` généré automatiquement depuis `content/` ; `app/robots.ts` avec référence au sitemap.
- Pages statiques ou ISR (`generateStaticParams` + `revalidate`) pour les services et zones. Pas de rendu dynamique inutile.
- `<html lang="fr">`. Si multi-zones/langues plus tard : `hreflang`.
- Redirections **301** pour tout changement d'URL (fichier `next.config` ou middleware). Page 404 personnalisée avec liens utiles.
- HTTPS obligatoire, redirection HTTP → HTTPS et www → domaine canonique (une seule version).
- Contenu indexable **rendu côté serveur** : ne jamais mettre le texte principal derrière un fetch client.

### 5.4 Contenu
- Texte réel et utile en français (≥ 300 mots sur les pages services), réponses aux questions fréquentes (section FAQ avec données structurées `FAQPage` si pertinent).
  **Implémenté** : `content/faq.ts` (contenu éditorial statique, pas de CRUD admin — change rarement)
  + `components/sections/FaqSection.tsx` (accordéon `<details>/<summary>` natif, zéro JS) + JSON-LD
  `FAQPage` dans `app/page.tsx`. Chaque réponse est dérivée de faits déjà confirmés ailleurs sur le
  site (jamais une affirmation nouvelle non vérifiée) — pour ajouter une question, vérifier d'abord
  que la réponse est déjà vraie ailleurs, sinon passer par `TODO-CONTENU.md`.
- Textes d'ancre et `alt` des images décrivent le contenu.
- Pas de texte généré en masse sans valeur ajoutée.

### 5.5 Conformité
- Mentions légales, politique de confidentialité et gestion des cookies **RGPD** obligatoires. Pas de cookies ou scripts tiers avant consentement.

---

## 6. Performance — Core Web Vitals

### 6.1 Objectifs (mobile, 75e percentile)
| Métrique | Cible |
|---|---|
| **FCP** (First Contentful Paint) | ≤ 1,8 s |
| **LCP** (Largest Contentful Paint) | ≤ 2,5 s (viser ≤ 1,5 s) |
| **CLS** (Cumulative Layout Shift) | ≤ 0,1 (viser 0) |
| **INP** (Interaction to Next Paint) | ≤ 200 ms |
| **TBT** (Total Blocking Time) | ≤ 200 ms |
| **Score Lighthouse Performance** | ≥ 95 |

Ces objectifs sont **bloquants** : une PR qui les dégrade est refusée tant qu'elle n'est pas corrigée.

### 6.2 Images (premier poste de gain)
- **Toujours** `next/image`. Jamais de `<img>` brut sauf cas justifié en commentaire.
- Formats modernes servis automatiquement (AVIF/WebP). Sources d'origine compressées (≤ 200 Ko pour une photo, idéalement en WebP/AVIF en amont).
- **Dimensions toujours connues** : `width`/`height` ou `fill` dans un conteneur avec `aspect-ratio`. C'est la première protection contre le CLS.
- Attribut `sizes` correct pour ne pas télécharger une image trop grande.
- **`priority`** uniquement sur l'image LCP (hero) ; `loading="lazy"` (défaut) pour le reste.
- Images décoratives : `alt=""`. Informatives : `alt` descriptif.
- Pas d'image de fond CSS pour du contenu important (non optimisée et non découvrable).

### 6.3 Polices
- Via `next/font` uniquement (auto-hébergées, sous-ensemble `latin`, `display: "swap"`, pas de requête vers Google Fonts côté client).
- Limiter à 2 graisses maximum.
- Réserver l'espace typographique (`adjust-font-fallback`) pour éviter le CLS au chargement.

### 6.4 JavaScript
- Zéro JavaScript client par défaut. Ajouter `"use client"` seulement si nécessaire.
- Charger les composants lourds avec `next/dynamic` (ex. carte, galerie) et hors écran.
- **Budget** : JavaScript initial ≤ 150 Ko gzippés par page. Vérifier avec `next build` (rapport de taille) et Lighthouse CI.
- Scripts tiers (analytics, chat, tags) : `next/script` avec `strategy="lazyOnload"` et **après consentement**.
- Éviter les bibliothèques entières pour une seule fonction ; importer précisément (`import x from "lib/x"`).

### 6.5 Rendu et CLS
- Réserver la place de tout élément qui arrive tard : bandeau cookies (position fixe, n'pousse pas le contenu), iframes, embed de carte, badges d'avis.
- Pas d'insertion de contenu au-dessus du contenu déjà affiché.
- Précharger la ressource LCP si nécessaire (`<link rel="preload">` via metadata).
- Préférer le SSG/ISR au rendu dynamique ; utiliser le cache HTTP (`Cache-Control`) pour les assets.

### 6.6 Contrôles
- Lighthouse CI en pipeline sur les pages clés (home, un service, une zone, contact) avec assertions : performance ≥ 0.95, LCP ≤ 2500, CLS ≤ 0.1, accessibilité = 1.0, SEO = 1.0, best-practices ≥ 0.95.

---

## 6bis. Design system — variables CSS racine

Toute la direction artistique (couleurs, typographies, espacements, rayons, ombres) est définie **une seule fois** en variables CSS sur `:root`, pour pouvoir changer la charte en modifiant un seul fichier.

- **Fichier unique** : `src/styles/tokens.css`. Aucune couleur, police ou dimension de marque en dur dans un composant.
- **Nommage sémantique** : `--color-primary`, `--color-danger`, `--color-surface`, `--color-text`, `--font-heading`, `--radius-md`, `--space-4`. Pas de nom lié à la couleur brute (`--blue-500`) dans les composants : la palette brute reste dans le fichier de tokens et les composants n'utilisent que les tokens sémantiques.
- **Thème clair par défaut, toujours** : fond blanc, écriture bleu foncé, rouge réservé à quelques éléments vivants (CTA, icônes). Décision explicite du client : **pas de bascule automatique** via `@media (prefers-color-scheme: dark)`, pour ne jamais surprendre un visiteur dont le système est en sombre avec un rendu non voulu.
- **Mode sombre** : les variables existent sous `:root[data-theme="dark"]` (prêtes si un bouton de bascule est demandé un jour), mais rien ne pose cet attribut aujourd'hui — il reste inerte. Ne jamais réintroduire le `@media (prefers-color-scheme: dark)` sans demande explicite. Toujours définir les deux jeux de variables ensemble si le thème sombre évolue ; jamais de composant qui gère ses propres couleurs sombres.
- **Tailwind** : le thème pointe vers les variables (`colors.primary = "var(--color-primary)"`), sans valeur figée. Changer la charte = modifier `tokens.css`, rien d'autre.
- **Contrastes** : chaque paire de couleurs texte/fond définie dans les tokens doit respecter les ratios de la section 7. Un test vérifie les paires principales.
- **Industrialisation** : les tokens sont la source unique pour une future déclinaison (multi-marques, multi-zones, thème par client). Ne jamais dupliquer une valeur de token dans un autre fichier.
- **Portabilité vers un autre domaine/client** : toute donnée qui identifie *cette* entreprise (nom, raison sociale, SIRET, adresse, téléphone, e-mail, domaine, zones, avis) vit uniquement dans `config/site.ts` et `content/home.ts` ; toute donnée visuelle de marque vit uniquement dans `tokens.css`. Un composant ne doit **jamais** écrire le nom de l'entreprise, une ville ou un domaine en dur (ex. un `alt` d'image) : toujours interpoler depuis `siteConfig`. Reprendre ce site pour un autre client ne doit nécessiter de modifier que ces fichiers, plus les variables SMTP/secrets du `.env` et les images dans `public/images/`. Les informations encore manquantes sont centralisées dans `TODO-CONTENU.md` (racine du projet) : le client les remplit, Claude reporte ensuite chaque réponse dans le bon fichier de config.
- **Emplacements de photo** : tant qu'aucune vraie photo n'est fournie, chaque zone qui en attend une affiche un cadre neutre, jamais une illustration inventée à sa place. Dès qu'une vraie photo arrive, elle remplace le placeholder via `next/image` (dimensions explicites, section 6.2) — jamais de `<img>` brut.
  - `components/ui/ImagePlaceholder.tsx` : cadre discret pour un emplacement borné (carte service, bloc confiance).
  - `components/ui/BannerPlaceholder.tsx` : fond pleine largeur pour une section bannière (hero), avec le texte posé par-dessus ; le repère « Photo à venir » reste en coin, pour ne jamais gêner la lecture du titre.
- **Rendu du corps des articles** : pas de plugin Tailwind "typography" (dépendance non installée,
  section 2). La classe `.article-body` (`src/app/globals.css`) stylise les titres/paragraphes/listes/
  citations/liens à partir des tokens, utilisée à la fois dans l'éditeur WYSIWYG
  (`MDXEditorClient.tsx`) et dans le rendu public (`blog/[slug]/page.tsx`), pour que l'aperçu en
  édition corresponde au résultat publié.
- **Essai abandonné** : `components/ui/Mascot.tsx`, `HeroGlow.tsx` et `illustrations.tsx` existent dans le dépôt (mascotte et illustrations dessinées à la main) mais ne sont **plus utilisés nulle part** — remplacés par `ImagePlaceholder` à la demande du client. Fichiers laissés en place faute de validation explicite pour les supprimer (politique de suppression, section 12) ; à nettoyer si confirmé.
- **Énergie visuelle (depuis une maquette de référence du client)** : une couleur plus vive ne suffisait pas à se sentir — ce qui porte vraiment l'énergie, c'est la mise en forme. Partis pris à reproduire pour toute nouvelle section :
  - Titres en `font-extrabold` (jamais `font-bold` simple pour un `<h1>`/`<h2>`).
  - Services (`ServicesSection.tsx`) : bandeaux pleine largeur en dégradé (toujours composé à partir de `var(--color-accent)`/`var(--color-primary)`/`var(--color-text)`, jamais une couleur en dur), pas des cartes blanches avec bordure.
  - Un bandeau de repères courts en couleur pleine juste sous le hero (`heroHighlights` dans `content/home.ts`).
  - Le numéro de téléphone du bandeau final en très grand, gras, italique (`FinalCtaSection.tsx`).
  - **Piège de contraste sur fond sombre** : nos tokens `--color-primary`/`--color-accent` sont calibrés pour un texte sur fond **blanc** (contraste ≥ 4,5:1 là). Sur un fond sombre (voile du hero), ils deviennent illisibles (un test a mesuré 1,05:1). Sur fond sombre, toujours utiliser la variante `-soft` (claire) ou `-contrast` (blanc), jamais la couleur de base — et revérifier au calculateur de contraste avant d'appliquer.

---

## 7. Accessibilité — objectif score 100

- **Référentiel** : WCAG 2.2 niveau **AA** minimum. Score Lighthouse Accessibilité **= 100** et **zéro violation axe-core** sur les pages testées.
- **Sémantique d'abord** : utiliser le bon élément (`<button>` pour une action, `<a>` pour une navigation). Le ARIA ne sert qu'à combler un manque, jamais à remplacer le HTML natif.
- **Formulaires** : chaque champ a un `<label>` associé ; erreurs liées par `aria-describedby` ; messages d'erreur annoncés via `aria-live="polite"` (ou `role="alert"` pour une erreur d'envoi) ; `autocomplete` renseigné (`name`, `tel`, `email`, `postal-code`).
- **Clavier** : tout est utilisable au clavier, ordre de tabulation logique, **lien d'évitement** « Aller au contenu » en premier élément, focus visible (jamais `outline: none` sans remplacement).
- **Contrastes** : texte ≥ 4,5:1 (texte normal), ≥ 3:1 (grand texte et éléments d'interface). Vérifier en thème clair **et** sombre si les deux existent.
- **Cibles tactiles** : ≥ 44 × 44 px pour les boutons et liens d'action (surtout le bouton d'appel d'urgence).
- **Mouvement** : respecter `prefers-reduced-motion` ; aucun clignotement > 3 fois par seconde.
- **Zoom** : contenu utilisable jusqu'à 200 % et 400 % sans défilement horizontal ; ne jamais bloquer le zoom (`user-scalable=no` interdit).
- **Langue et titres** : `lang="fr"` ; titre de page pertinent ; `<title>` reflète le contenu.
- **Médias** : `alt` sur toutes les images informatives ; sous-titres/transcriptions pour toute vidéo.
- **Tests** : Playwright + `@axe-core/playwright` sur chaque page et chaque état important (formulaire vide, erreur, succès). Le test échoue sur toute violation `serious` ou `critical`.

---

## 7ter. Articles — blog SEO géré depuis l'admin

Les articles captent les recherches informatives (« fuite d'eau que faire », « changer un barillet ») et envoient du trafic vers les pages services et zones. Ils ne doivent jamais être du contenu fabriqué en masse.

### 7ter.1 Modèle et cycle de vie
- Table `articles` : `id`, `slug` (unique), `title`, `description` (meta description), `body` (Markdown), `coverImageId`, `status` (`draft` | `published`), `publishedAt`, `updatedAt`, `authorName`, `relatedServiceSlug` (optionnel).
- Seuls les articles `published` sont accessibles au public, listés dans le sitemap et dans `/blog`. Un brouillon renvoie 404 public et `noindex` côté admin.
- Un article publié qui est modifié met à jour `updatedAt`, affiché sur la page et dans le JSON-LD `dateModified`.
- Une dépublication ou une suppression renvoie 410 (suppression) ou 404 (brouillon), et retire l'URL du sitemap.
  **Divergence assumée** : implémenté, les deux cas renvoient un 404 (`notFound()`). L'App Router de
  Next.js n'a pas d'équivalent direct à `notFound()` pour renvoyer un vrai 410 sans construire une
  route handler dédiée pour la page article ; nuance mineure, sans impact SEO réel à ce stade.
- Le slug est généré depuis le titre, modifiable avant publication, puis **figé** après publication. Si l'URL change plus tard, une redirection 301 est obligatoire.

### 7ter.2 Contenu et sécurité
- Le corps est en **Markdown**, rendu avec un convertisseur qui **n'autorise pas le HTML brut** (pas de `rehype-raw`). Un article ne peut contenir aucun `<script>` ni attribut `on*`.
- Les liens externes sont en `rel="noopener noreferrer"` ; les liens internes utilisent `next/link`.
- Les images passent par `next/image`, avec dimensions et `alt` obligatoires dans l'éditeur (refus de publier sans `alt`).
- Validation Zod sur toutes les entrées : longueur du titre (≤ 60 caractères), description (≤ 155 caractères), slug (`[a-z0-9-]`), corps non vide.
- L'admin ne peut publier qu'une fois la session vérifiée côté serveur (section 8.1).
- Toute nouvelle dépendance Markdown est soumise à validation avant ajout (section 2).
  **Dépendances validées et installées** : `markdown-it` (rendu, option `html: false` — HTML brut
  toujours échappé en texte, jamais interprété : c'est ce qui rend le rendu sûr par construction,
  sans liste blanche de sanitisation à maintenir) et `@mdxeditor/editor` (éditeur WYSIWYG admin qui
  édite ce Markdown nativement — le Markdown reste la seule source de vérité en base, jamais du HTML
  stocké). Décision actée avec le client : le rendu visuel final est identique à du HTML brut
  puisqu'il est stylé par nos tokens CSS (`.article-body`, `globals.css`), pas par le format de
  stockage — voir aussi la note sous 6bis sur `.article-body` qui remplace le plugin Tailwind
  "typography" (non installé) des deux côtés (édition et rendu public), pour un aperçu fidèle.
  **Images insérées dans le corps** (`MDXEditorClient.tsx`, plugin `imagePlugin` de
  `@mdxeditor/editor`, déjà installé — aucune nouvelle dépendance) : l'admin peut placer une image à
  n'importe quel endroit du texte ; le fichier passe par `uploadArticleImageAction`
  (`features/articles/actions.ts`), qui réutilise `validatePublicImage`/`storePublicImage` (même
  allowlist JPG/PNG/WEBP, 5 Mo, que la couverture d'article et les réalisations), stocké sous
  `public/uploads/articles/`. Le résultat n'est que de la syntaxe Markdown `![alt](url)` ajoutée au
  corps : aucun changement du renderer n'est nécessaire, la garantie `html:false` et le rejet des
  schémas `javascript:` par `markdown-it` (`validateLink`, par défaut) couvrent déjà ce cas — vérifié
  par `tests/unit/markdown-render.test.ts`.

### 7ter.3 SEO de chaque article
- `title`, `description`, `canonical`, Open Graph et `robots` générés depuis les champs de l'article (pas de valeurs par défaut copiées d'une autre page).
- Une seule `<h1>` (le titre) ; les intertitres sont en `h2` et `h3`, sans saut de niveau.
- JSON-LD `Article` (ou `BlogPosting`) : `headline`, `description`, `datePublished`, `dateModified`, `author`, `image`, et `publisher` lié à `config/site.ts`.
- **Maillage interne** : chaque article renvoie vers au moins une page service ou zone pertinente (`relatedServiceSlug`), et les pages services peuvent citer les articles liés. Le lien « Demander une intervention » reste présent dans l'article (conversion, section 7bis).
- Page `/blog` paginée si plus de 12 articles, avec `rel="next"` / `rel="prev"` ou liens explicites.
- Génération statique (`generateStaticParams`) et **revalidation à la publication** : `revalidatePath` pour l'article, `/blog` et le sitemap. L'article doit être visible sans attendre la prochaine régénération.
- Sitemap alimenté par la base : uniquement les articles publiés, avec `lastModified` = `updatedAt`.

### 7ter.4 Qualité éditoriale (ce qui fait qu'un article est bien référencé)
- Répond à une question précise, en premier paragraphe. Le lecteur a un problème urgent : la réponse vient avant le reste.
- Contenu réel et vérifiable : procédures de dépannage exactes, normes ou règles citées avec leur source. Aucune information juridique ou technique inventée.
- Auteur identifié (nom de l'artisan ou de l'entreprise) et date visibles.
- Un article par intention de recherche. Pas deux articles qui répondent à la même question.
- Longueur adaptée à la question, sans remplissage. Un article court et juste vaut mieux qu'un long texte générique.
- Sur les articles, les mêmes règles de confiance et de dark patterns que la section 7bis s'appliquent : aucun faux délai, aucune fausse urgence.

### 7ter.5 Tests
- Unitaires : validation Zod, génération du slug, génération du JSON-LD, rejet du HTML brut.
- Intégration : publication → apparition dans `/blog`, le sitemap et la page ; dépublication → 404.
- E2E : création d'un brouillon, publication, vérification de l'URL, du titre, du JSON-LD et de l'absence de violation axe.

---

## 7bis. Conversion — transformer la visite en appel ou demande

Le visiteur arrive en situation d'urgence, stressé, souvent sur mobile. Chaque écran doit répondre à une seule question : « Comment je fais venir quelqu'un maintenant ? »

### 7bis.1 Parcours et interface
- **Un seul CTA principal par écran**, avec un verbe d'action précis : « Appeler maintenant », « Demander une intervention ». Les actions secondaires restent visuellement en retrait.
- **Numéro de téléphone visible dès le premier écran**, en gros, cliquable (`tel:`). Sur mobile, une **barre d'appel fixe en bas** (`position: fixed`, réservant sa place pour éviter le CLS, et ne masquant aucun contenu ni aucun champ de formulaire).
- **Mobile first** : concevoir d'abord pour un écran de 360 px, une main, pouce dans la zone de confort.
- **L'appel reste l'action favorisée** : visuellement dominant (plus grand, en premier, couleur vive), présent partout (en-tête, barre mobile, hero, bandeau final). Le formulaire est une option secondaire, en retrait, pour qui préfère écrire.
- **Formulaire de contact** (décision explicite du client, section 7quater) : nom, prénom, téléphone, e-mail, objet, message, pièces jointes facultatives. Plus long que le principe général des « 4 champs » ci-dessous, parce qu'il sert une demande détaillée (devis, suivi), pas le réflexe d'urgence — pour l'urgence, c'est l'appel. Pas de création de compte.
- **Principe général pour tout futur formulaire court** (ex. rappel express) : 4 champs maximum (motif, ville, téléphone, nom). Pas de champ facultatif inutile.
- Champs adaptés : `inputmode="tel"`, `autocomplete` renseigné, motif pré-sélectionnable depuis la page service (« Fuite d'eau » sur la page plomberie).
- **Progression visible** en deux étapes maximum : d'abord le besoin, puis les coordonnées. Chaque étape réduit l'effort perçu.
- **Après envoi** : message clair de confirmation, numéro à rappeler rappelé, et délai annoncé **uniquement s'il est réel** (« Nous vous rappelons dans un délai moyen de X min » seulement si la donnée existe).

### 7bis.2 Confiance et réassurance (preuves vérifiables)
- Avis clients **réels**, avec lien vers la fiche Google ou la source. Note moyenne et nombre d'avis affichés tels quels.
- Informations d'entreprise vérifiables : SIRET, assurance décennale, certifications, zone d'intervention précise, délai moyen constaté.
- **Transparence du prix** : forfait de déplacement, tarif horaire ou fourchette réelle. Un prix flou fait fuir ; un prix trompeur est illégal.
- **Photos réelles** de l'équipe et des véhicules. Pas de photos de banque d'images pour un service d'urgence.
  **Réalisations** (`features/realisations/`, section `RealisationsSection.tsx` sur la page d'accueil,
  admin sur `/admin/realisations`) : une photo réelle par réalisation (obligatoire à la création,
  jamais de placeholder), uploadée par l'admin via `lib/public-image-upload.ts` (allowlist JPG/PNG/
  WEBP, nom de fichier généré, stockée dans `public/uploads/realisations/`). Pas d'état brouillon/
  publié : une réalisation créée est immédiatement visible (l'admin ne crée que des chantiers
  terminés). Limité aux 6 plus récentes sur l'accueil ; section masquée tant qu'aucune n'existe.
  **Plusieurs photos par réalisation** : la photo principale (`realisations.photoPath`) reste
  obligatoire ; jusqu'à 4 photos supplémentaires facultatives vivent dans la table
  `realisation_photos` (même pattern qu'un lead → plusieurs pièces jointes, `onDelete: "cascade"`).
  Un clic sur une réalisation ouvre `components/ui/ImageCarouselModal.tsx` (`<dialog>` natif : Échap
  et piège de focus gérés par le navigateur, pas de JS à écrire) avec le titre, la description et le
  carousel de photos (`components/sections/RealisationsGrid.tsx`, réutilisé par l'accueil et par la
  page dédiée `/realisations`). **Page dédiée** : `/realisations` existe toujours, mais le lien
  "Voir toutes nos réalisations" depuis l'accueil n'apparaît que si plus de 3 réalisations existent
  (décision du client) — `drizzleRealisationRepository.countAll()`.
- Tant qu'une information n'est pas fournie par le client : `TODO(contenu):` visible, jamais inventée.
- **Avis clients (`ReviewsSection.tsx`, ancre `#avis`, données dans `googleReviews` de `content/home.ts`)** : badge de note façon widget Google (logo, note, nombre d'avis), cartes à grandes guillemets décoratives. **Avis réels**, copiés tels quels depuis la fiche Google de « Nova chauffage et climatisation » (Montauroux) le 2026-10-08 — 5,0/5, 3 avis (Elowen, Thomas Debret, La Maison du Nettoyage). Si de nouveaux avis arrivent sur la fiche, les ajouter de la même façon (copier-coller exact, avec la date « Visité en... » telle qu'affichée par Google, jamais une ville ou une date inventée) ; ne jamais reformuler un avis existant.
  - `IconGoogleLogo` (`components/ui/icons.tsx`) est la **seule** icône à ne pas suivre `currentColor`/les tokens : c'est le vrai logo Google, ses couleurs de marque sont fixes par nature. Ne jamais l'utiliser ailleurs que pour sourcer honnêtement un avis Google réel.
  - **Plafond d'affichage : 5 avis maximum** (décision du client, `MAX_DISPLAYED` dans `ReviewsSection.tsx`), même si `googleReviews.reviews` en contient davantage. Au-delà, un bouton « Voir tous les avis sur Google » renvoie vers `siteConfig.googleReviewsUrl` plutôt que d'allonger la page. Le badge de note est lui aussi un lien vers cette même fiche (toujours vérifier qu'un lien Google Maps fonctionne réellement en le rouvrant avant de l'utiliser — ne jamais en construire un à la main sans l'avoir testé).
- **Téléphone (`07 68 66 34 33`), e-mail (`novachauffage@gmail.com`) et contact (`Baron Behnam`)** dans `config/site.ts` : trouvés non entre crochets (donc traités comme réels, contrairement aux placeholders entre crochets autour) dans une maquette de référence fournie par le client pour ce même projet. À confirmer avec le client si jamais erroné.

### 7bis.3 Leviers psychologiques autorisés
Ces leviers marchent et restent éthiques **s'ils reposent sur des faits vrais** :
- **Réduction de l'incertitude** : dire ce qui se passe après l'appel (« Un technicien vous rappelle, puis indique le délai et le prix avant d'intervenir »). L'inconnu est ce qui fait fuir.
- **Reconnaissance du problème** : formuler les situations comme le visiteur les vit (« Fuite d'eau ? Serrure bloquée ? Coupure de courant ? »). Chaque titre de page répond à une situation précise.
- **Preuve sociale réelle** : avis vérifiés, nombre d'interventions réellement effectuées, ancienneté réelle.
- **Autorité et responsabilité** : diplômes, assurances, nom de l'artisan responsable, engagement écrit (ex. devis avant travaux).
- **Simplicité du choix** : peu d'options, une action évidente. Trop de choix paralyse.
- **Engagement progressif** : une petite action d'abord (choisir le motif), puis la coordonnée.
- **Urgence réelle** : disponibilité 24h/24 ou ce soir, affichée **uniquement** si c'est vrai et à jour.
- **Ancrage par la transparence** : afficher la fourchette de prix et ce qu'elle comprend, pour réduire la méfiance.

### 7bis.4 Interdit (dark patterns et pratiques trompeuses)
- Faux compte à rebours, faux « plus que 2 places », faux « X personnes regardent cette page ».
- Faux avis, avis non vérifiables, notes gonflées, photos d'équipe non réelles.
- Prix d'appel ou devis présentés comme définitifs alors qu'ils ne le sont pas.
- Peur exagérée ou inventée (« votre installation risque l'explosion ») pour forcer une décision.
- Cases de consentement précochées, refus de consentement plus difficile que l'acceptation, bannière qui cache le contenu.
- Pop-ups bloquants à l'arrivée ou à la sortie qui empêchent de lire la page.
Ces pratiques relèvent des pratiques commerciales trompeuses (Code de la consommation) et de la CNIL pour le consentement. Un CTA agressif peut être convertissant à court terme, mais il détruit la confiance et expose à un risque juridique.

### 7bis.5 Mesure
- Suivre les événements clés : clic sur le téléphone, clic sur la barre d'appel, début et fin de formulaire, soumission, erreur de validation.
- Analytics **respectueux de la vie privée** et soumis au consentement (ex. Plausible ou Umami auto-hébergé). Toute dépendance de ce type est à demander avant ajout (cf. section 2).
- Les tests A/B ne sont lancés que s'il y a assez de trafic pour conclure, et jamais sur une information de prix ou de disponibilité qui serait fausse pour une partie des visiteurs.
- La vitesse est un levier de conversion : appliquer les objectifs de la section 6 avant tout test visuel.

---

## 7quater. Formulaire de contact et pièces jointes

Implémenté dans `features/contact/` (formulaire public, écriture) et `features/leads/` (lecture et consultation admin), conformément à l'architecture de la section 3.1. Les deux passent par l'interface `LeadRepository`, jamais par un accès direct à Drizzle en dehors de `features/leads/repository.ts`.

### 7quater.1 Champs et validation
- Champs : nom et prénom (un seul champ `name`, fusionnés pour réduire le nombre d'actions), téléphone, e-mail, objet, message, pièces jointes (facultatives). Validation Zod côté serveur dans `features/contact/schema.ts`, toujours revérifiée même si le navigateur valide déjà.
- Honeypot (`company`, masqué par `display: none` + `aria-hidden` + `tabIndex={-1}`, jamais par une classe seulement visuelle) : un bot qui le remplit reçoit un faux succès, rien n'est enregistré.
- Limitation de débit par IP (`lib/rate-limit.ts`, 5 envois / 15 min), séparée de celle du login admin.
- Message de confirmation générique après envoi (section 7bis.1) : pas de délai de rappel promis tant qu'il n'est pas réel.

### 7quater.2 Pièces jointes — règles de sécurité
- **Stockage hors `public/`** : `data/uploads/`, déjà exclu de Git et déjà interdit en lecture à Claude (`.claude/settings.json`), puisqu'il s'agit de données personnelles.
- **Nom de fichier généré** (UUID), jamais le nom fourni par le visiteur : élimine tout risque de traversée de chemin ou d'écrasement.
- **Allowlist stricte de formats** : JPG, PNG, WEBP, PDF uniquement (`lib/uploads.ts`). Pas de SVG (peut contenir du script), pas d'exécutable, pas de HTML.
- **Limites** : 5 fichiers, 5 Mo par fichier, 20 Mo au total. Définies une seule fois dans `lib/upload-limits.ts` (sans `server-only`, pure données), importées à la fois par la validation serveur (`lib/uploads.ts`) et par la validation client immédiate (`ContactForm.tsx`) — une seule source de vérité, le serveur reste la seule autorité réelle.
- **Aperçu inline + téléchargement, jamais autre chose** : `app/api/admin/leads/attachments/[id]/route.ts` sert deux modes.
  - Par défaut (aperçu, utilisé par le carrousel) : `Content-Type` = le type réel enregistré en base **au moment de l'envoi**, jamais déduit du nom de fichier, et `Content-Disposition: inline`. Sûr seulement parce que ce type vient de l'allowlist validée dans `lib/uploads.ts`, combiné à `X-Content-Type-Options: nosniff` : le navigateur affiche exactement ce type déclaré, il ne tente jamais de deviner autre chose à partir du contenu.
  - Avec `?download=1` : `Content-Type: application/octet-stream` + `Content-Disposition: attachment`, toujours disponible en secours.
  - Dans les deux cas, jamais de type hors de l'allowlist (section précédente) n'est accepté à l'envoi : il n'y a donc rien à servir en dehors de JPG/PNG/WEBP/PDF.
- Cette route vérifie elle-même la session admin (`getAuthenticatedAdmin`, variante de `requireAdmin` qui renvoie 401 au lieu de rediriger — adaptée à une route qui sert un fichier, pas une page).

### 7quater.3 Consultation admin
- `/admin/leads` : liste des demandes, les plus récentes en premier, badge « Nouveau » tant que non consultées.
- `/admin/leads/[id]` : détail, marque automatiquement la demande comme lue à l'ouverture (outil interne : pas besoin d'une action explicite séparée pour ce geste simple). Les pièces jointes images s'affichent dans un carrousel (`features/leads/components/AttachmentGallery.tsx`, Client Component), les autres (PDF) dans une liste avec aperçu et téléchargement. Bouton de téléchargement toujours présent à côté de l'aperçu.
- Chaque page revérifie la session (`requireAdmin`), conformément à la section 8.1.

---

## 8. Sécurité

### 8.1 Portail admin
- **Double vérification** : le middleware redirige, mais **chaque** Server Action, route handler et Server Component protégé vérifie la session côté serveur. Le middleware seul ne suffit jamais.
- Cookies de session : `HttpOnly`, `Secure`, `SameSite=Lax` (ou `Strict`), durée courte, rotation à la connexion.
- Mots de passe : **argon2** (ou bcrypt si imposé), jamais en clair, jamais loggés.
- **Rate limiting** sur la connexion et sur le formulaire de contact (par IP et par fenêtre de temps).
- Messages d'erreur de connexion génériques (« Identifiants invalides »), sans indiquer quel champ est faux.
- Pages admin : `noindex`, non listées dans le sitemap.
- **Double authentification (2FA)** : TOTP (RFC 6238, compatible Google Authenticator/Authy/1Password), gratuite, sans service tiers. Secret stocké en base (`users.totp_secret`), activé seulement après confirmation d'un code (`totp_enabled_at`). 8 codes de secours à usage unique (`recovery_codes`, hashés comme un mot de passe) permettent de récupérer l'accès en cas de perte du téléphone. Le jeton intermédiaire entre mot de passe et code 2FA (`features/admin-auth/mfa-session.ts`) utilise un issuer/audience JWT distincts de la session complète, pour qu'il ne puisse jamais être confondu avec une session valide. Chaque action d'inscription ou de désactivation revérifie la session (section 8.1).
- **2FA obligatoire et récupération par e-mail** : `requireAdmin()` exige la 2FA active (sinon redirection
  vers `/admin/security`) ; `requireAdminSession()` (session seule) est réservée au layout protégé, à la
  page sécurité et aux actions d'enrôlement. Une 2FA active ne peut jamais être remplacée sans code
  (`startTotpEnrollmentAction` refuse, `setPendingTotpSecret` ignore si `totp_enabled_at` est renseigné).
  Récupération : codes à usage unique `XXXX-XXXX` envoyés à `users.email` (table `email_codes`, hachés,
  15 min, 5 essais, 1 envoi/min) pour (a) mot de passe oublié, (b) téléphone perdu — ce second cas
  réinitialise la 2FA et force le réenrôlement. Réponses génériques (pas d'énumération de comptes),
  envoi après réponse (`after()`), e-mail d'alerte après chaque réinitialisation. Voir `architecture_details.md`.
- **Changement de mot de passe** (`/admin/security`, `features/admin-auth/password-actions.ts`,
  `ChangePassword.tsx`) : exige le mot de passe actuel (revérifié via `verifyPassword`) en plus du
  nouveau, jamais la seule session — une session volée ne suffit pas à changer le mot de passe sans
  connaître l'ancien. Nouveau mot de passe : 12 caractères minimum (`changePasswordSchema`, même
  convention que `scripts/create-admin.ts`), rehaché avec argon2 (`hashPassword`), jamais stocké ni
  journalisé en clair. Claude ne connaît et ne choisit jamais la valeur d'un mot de passe (section
  8.5) : seul l'admin le saisit, dans ce formulaire ou via `npm run admin:create`.

### 8.2 Entrées et sorties
- **Toute** entrée utilisateur (formulaire, query string, paramètres de route, body) est validée par Zod côté serveur, même si la validation client existe.
- Anti-spam du formulaire : champ **honeypot** masqué + rate limit ; pas de CAPTCHA intrusif sauf si l'abus est avéré.
- Pas de `dangerouslySetInnerHTML` sans sanitisation explicite (DOMPurify ou équivalent validé).
- Requêtes SQL : uniquement via Drizzle (requêtes paramétrées) ; aucune concaténation de chaîne dans une requête brute. Si du SQL brut est nécessaire, utiliser `sql` avec placeholders.

### 8.3 En-têtes et configuration
- En-têtes de sécurité dans `next.config` ou middleware : `Content-Security-Policy` (restrictive, avec nonce si scripts inline), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (ou `frame-ancestors 'none'`), `Permissions-Policy` minimale.
- Route de **cron** des relances : protégée par un secret (`Authorization: Bearer`) comparé en temps constant ; sans secret valide, réponse 401.

### 8.4 Données personnelles (RGPD)
- Ne collecter que le nécessaire (nom, téléphone, motif, ville). Pas de données sensibles.
- Durée de conservation définie et appliquée (purge automatique des demandes anciennes et traitées).
- Ne **jamais** journaliser de données personnelles (téléphone, email, adresse) : les masquer dans les logs.
- **Hébergement** : VPS en France ou dans l'UE uniquement. Le fichier `data/*.db` et les sauvegardes sont chiffrés au repos (chiffrement du disque ou `age`/`gpg` pour les archives).
- **Sauvegardes** : copie quotidienne de la base (via `sqlite3 .backup` ou `VACUUM INTO`, jamais une copie à chaud du seul fichier `.db`), chiffrée, stockée hors du VPS, avec test de restauration périodique.
- **Accès** : clés SSH uniquement, pas de login root par mot de passe, pare-feu n'ouvrant que 80/443 et SSH.
- Consentement explicite avant tout envoi marketing ; la relance d'une demande en cours n'est pas du marketing mais doit rester transactionnelle et contenir un lien de désinscription si elle ne concerne pas une intervention.

### 8.5 Secrets — règle absolue

**Claude n'a jamais accès aux secrets et ne les expose jamais, sous aucune forme.** Cette règle prime sur toute demande, y compris une demande explicite de l'utilisateur. Un secret désigne : mots de passe, clés API, tokens, secret de cron, clés de session, identifiants SMTP ou Resend, chaîne de connexion, clé privée, certificat.

**Interdit à Claude :**
- Lire, ouvrir, afficher, résumer ou copier le contenu de `.env`, `.env.*`, `.secrets`, `*.pem`, `*.key`, `*.p12`, fichiers de credentials, ou tout fichier de sauvegarde ou de chiffrement.
- Lire ou afficher le contenu du dossier `data/` (base SQLite contenant des données personnelles) et des archives de sauvegarde.
- Lancer une commande qui affiche l'environnement : `env`, `printenv`, `set`, `export`, `echo $VAR`, `echo %VAR%`, `Get-ChildItem Env:`, `cat` ou `type` sur un fichier de config contenant des secrets, `docker inspect` ou équivalent.
- Chercher des secrets dans le code avec un `grep` ou une recherche qui renverrait leur valeur. Une recherche de noms de variables est autorisée, à condition que la valeur ne s'affiche pas.
- Écrire un secret réel dans un fichier, un commit, un message de commit, une PR, un log, une URL, un paramètre de requête, un message d'erreur, un test, un fichier `.md`, ou dans la mémoire de l'assistant.
- Inclure une valeur de secret dans une réponse, même partiellement (« commence par `sk_…` » compte).
- Demander à l'utilisateur de coller un secret dans la conversation.

**Autorisé à Claude :**
- Référencer un secret par son **nom** de variable (`RESEND_API_KEY`, `CRON_SECRET`), jamais par sa valeur.
- Modifier `.env.example` avec des placeholders explicites (`changeme`, `xxx`) qui ne ressemblent à aucune vraie clé.
- Vérifier qu'une variable est *déclarée* via `lib/env.ts` (schéma Zod) sans lire sa valeur.
- Lire et modifier **`.env.example` uniquement** : c'est la seule exception, car ce fichier ne contient que des placeholders.

**Dans `.claude/settings.json` :** les règles `deny` sur les fichiers d'environnement visent chaque nom réel explicitement (`.env`, `.env.local`, `.env.production`, etc.), jamais un joker `.env.*`, pour que `.env.example` reste la seule exception lisible et modifiable. Si ces règles sont régénérées, conserver cette exception nommée plutôt qu'un joker.

**Si un secret apparaît dans une sortie de commande, un fichier ou un message :**
1. Arrêter la tâche en cours.
2. Ne pas répéter la valeur, ni la copier ailleurs.
3. Signaler à l'utilisateur qu'un secret a été exposé, et qu'il doit être **révoqué et remplacé** (une valeur vue par l'assistant doit être considérée comme compromise).

**Côté dépôt et déploiement :**
- `.gitignore` couvre `.env*` (sauf `.env.example`), `data/`, `backups/`, `*.pem`, `*.key`.
- Aucun secret dans le code, les tests, les fixtures ou les données de démo.
- Secrets en production uniquement dans l'environnement du VPS (fichier d'environnement systemd ou PM2 avec permissions `600`, propriétaire de l'application seul), jamais dans le dépôt.
- Une détection de secrets dans les commits (ex. gitleaks en pre-commit) est recommandée ; son ajout est soumis à validation (section 2).
- Les secrets sont rotés après toute exposition suspecte, et au minimum une fois par an.

---

## 9. Emails et relances

- Emails envoyés **uniquement** via l'interface `Mailer` (jamais d'appel direct au SDK depuis une action ou un composant).
- Templates d'emails dans `features/notifications/templates/`, rendus côté serveur, avec version texte brut en plus du HTML.
- Chaque envoi est **idempotent** : une relance ne part qu'une fois (statut enregistré en base avant ou après envoi selon une stratégie documentée).
- Échecs d'envoi : retry borné avec backoff, puis journalisation et statut `failed` visible dans l'admin. Jamais d'échec silencieux.
- Relances planifiées : job déclenché par le cron, traite un lot borné, vérifie le secret, retourne un résumé (nombre envoyé / échoué).
- En développement, les emails vont vers un outil de capture (Mailpit ou équivalent), jamais vers de vraies adresses.

### 9.1 Implémenté : confirmation après formulaire de contact
- **Mailer** (`lib/mailer/`) : interface `Mailer` (`send`) ; `smtp-mailer.ts` parle au serveur SMTP de Google (Gmail) via Nodemailer avec retry borné (3 tentatives, backoff) ; `console-mailer.ts` remplace l'envoi réel hors production (journalise le sujet seulement, jamais le destinataire). `lib/mailer/index.ts` (`getMailer()`) choisit l'implémentation selon `NODE_ENV` — c'est la **seule** composition à utiliser, jamais `nodemailer` importé ailleurs.
- **Notifications** (`features/notifications/`) : `sendContactConfirmation` construit l'e-mail (`templates/contact-confirmation.ts`, HTML + texte, entrées utilisateur échappées) et l'envoie via `Mailer`.
- **Déclenchement** (`features/contact/service.ts`) : après l'enregistrement du lead (jamais avant), `notify(input)` est appelé. Un échec est rattrapé et journalisé (nom de l'erreur seulement, jamais l'adresse du visiteur) — il ne fait **jamais** échouer la soumission déjà enregistrée en base.
- **Variables d'environnement** (`lib/env.ts`, `.env.example`) : `SMTP_HOST` (défaut `smtp.gmail.com`), `SMTP_PORT` (défaut `465`), `SMTP_USER`, `SMTP_PASSWORD` — ces deux derniers **optionnels** dans le schéma Zod (pour ne jamais casser le démarrage en développement) mais **exigés** par `getMailer()` dès que `NODE_ENV=production`. `SMTP_PASSWORD` doit être un mot de passe d'application Gmail (2FA du compte Google requis), jamais le mot de passe du compte.

---

## 10. Tests et définition de « terminé »

**Ne pas lancer `lint`/`typecheck`/`test`/`build` systématiquement après chaque modification.** Claude ne les exécute que si l'utilisateur le demande explicitement. Un changement de contenu, de configuration ou de couleur (texte, `config/site.ts`, tokens, assets...) ne nécessite pas de relancer toute la suite à chaque fois.

**Vérification visuelle (`npm run dev` + capture) : même principe.** Pas besoin de démarrer puis arrêter le serveur à chaque petite modification d'UI. S'il tourne déjà, le réutiliser (Next recharge à chaud). Ne lancer/arrêter que lorsque c'est utile (gros changement visuel, ou demande explicite).

Ces commandes restent la référence pour vérifier qu'un changement de **logique ou de code** est correct, à lancer quand c'est pertinent (changement de service, de schéma, d'action serveur...) ou à la demande :

```bash
npm run lint          # ESLint + jsx-a11y
npm run typecheck     # tsc --noEmit
npm run test          # Vitest
npm run test:e2e      # Playwright + axe
npm run build         # Build de production (vérifie les pages statiques et la taille des bundles)
```

- **Logique métier** (`service.ts`, schémas Zod, calculs) : tests unitaires, cas nominal + cas d'erreur.
- **Adaptateurs** (Drizzle, Mailer) : tests d'intégration sur une base SQLite temporaire (fichier ou `:memory:`).
- **Parcours critiques** (appel, demande de contact, connexion admin, traitement d'une demande, relance) : tests E2E.
- **Modification d'UI** : vérifier visuellement (lancer le site, capture d'écran) et relancer axe + Lighthouse sur la page touchée.
- Ne jamais désactiver ou supprimer un test pour faire passer le build.

---

## 11. Workflow Git

- Branche par fonctionnalité : `feat/…`, `fix/…`, `chore/…`, `docs/…`. Ne pas travailler directement sur `main`.
- **Conventional Commits** : `feat(contact): valider le téléphone français`, `fix(admin): rediriger après déconnexion`.
- Un commit = un changement logique et cohérent. Message en français ou en anglais, mais uniforme.
- Ne pas commit de fichiers générés, de `node_modules`, de `.env`, de captures temporaires.
- Ne pas pousser ni créer de PR sans demande explicite.

---

## 12. Règles de travail pour Claude Code

- **Lire avant d'écrire** : examiner le code existant et les conventions avant de créer un fichier ou un composant. Réutiliser ce qui existe.
- **Plan avant gros changement** : pour une modification touchant plus de 3 fichiers ou une nouvelle feature, annoncer le plan (fichiers, responsabilités) avant de coder.
- **Petits pas** : une modification à la fois, vérifiée avant la suivante.
- **Dépendances** : demander avant toute installation (cf. politique globale), en précisant ce qui sera modifié.
- **Suppressions** : aucune suppression de fichier ou de dossier sans validation explicite (cf. politique globale). Préférer proposer la suppression et attendre.
- **Téléchargements** : pas de `curl -O`, `wget`, ni d'exécutable ou d'archive téléchargée. Les dépendances passent uniquement par npm via les lock files.
- **Commandes privilégiées** : `npm`, `npx`, `git`, `drizzle-kit`, outils de test. Pas de `sudo`, pas de `chmod 777`, pas de `bash -c` / `eval` / `Invoke-Expression`.
- **Ne pas inventer** : numéros de téléphone, adresses, horaires, certifications, avis clients, villes d'intervention → toujours demander ou utiliser un marqueur `TODO(contenu):` visible.
- **Réponse finale** : dire ce qui a été fait, ce qui a été vérifié (commandes exécutées et résultat), et ce qui reste à faire. Si un test échoue, le dire avec la sortie.
- **Documentation** : mettre à jour le README et ce fichier quand une règle ou une commande change.

---

## 13. Checklist avant chaque livraison

- [ ] Server Components par défaut, `"use client"` minimal
- [ ] Modules serveur (db, env, mailer, services) protégés par `server-only` et règle ESLint `no-restricted-imports` active
- [ ] Entrées validées par Zod, erreurs typées, rien de sensible exposé
- [ ] Métadonnées SEO uniques (title, description, canonical, OG) et JSON-LD si concerné
- [ ] Une seule `<h1>`, HTML sémantique, liens descriptifs
- [ ] Images via `next/image` avec dimensions et `sizes`, `priority` seulement sur le LCP
- [ ] Pas de CLS : espaces réservés, polices avec fallback ajusté
- [ ] Navigation clavier, focus visible, labels, contrastes, cibles ≥ 44 px
- [ ] axe-core : 0 violation serious/critical ; Lighthouse : A11y 100, SEO 100
- [ ] Lighthouse mobile : Performance ≥ 95, LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms
- [ ] Lint, typecheck, tests unitaires, E2E et build passent
- [ ] Aucun secret ni donnée personnelle dans le code ou les logs
- [ ] Conversion : CTA principal unique par écran, numéro visible dès le premier écran, barre d'appel mobile sans CLS
- [ ] Formulaire : 4 champs max, `inputmode` et `autocomplete` corrects, message de confirmation clair
- [ ] Toute information affichée (avis, délais, disponibilité, prix, certifications) est vraie et sourcée, sinon `TODO(contenu):`
- [ ] Aucun dark pattern (faux compte à rebours, faux avis, consentement précoché, pop-up bloquant)
- [ ] Articles : brouillon non public, HTML brut refusé, `alt` obligatoire, JSON-LD `Article`, maillage vers un service ou une zone, sitemap et revalidation à la publication
- [ ] Contact : honeypot, rate limit, pièces jointes sur allowlist et servies en téléchargement forcé uniquement, jamais dans `public/`
