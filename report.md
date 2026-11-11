# TODO — Site Nova Chauffage (issu de l'audit du 2026-11-11)

Méthode : lecture statique du code uniquement (rien exécuté : ni build, ni tests, ni Lighthouse, ni axe).
Référentiel : `CLAUDE.md`. Avancement estimé : **~60-65 %** — le socle technique est solide ; il reste
surtout des mécanismes (sécurité, SEO local, exploitation, tests) puis le contenu client.

**Légende** : 🔴 bloquant / à faire avant mise en ligne · 🟠 important · 🟢 confort.
Ordre du document : mécanismes d'abord, **contenu du site en dernier** (section 8).

---

## 1. Sécurité

- [ ] 🔴 **2FA désactivable sans code** — `features/admin-auth/mfa-enrollment-actions.ts:24-34` appelle
  `setPendingTotpSecret`, qui remet `totpEnabledAt = null` (`user-repository.ts:47`) même quand la 2FA est
  active : une session volée neutralise la 2FA. → Refuser le démarrage si la 2FA est active, ou exiger un code.
- [ ] 🟠 **Sessions non révocables** — `session.ts` : JWT stateless de 2 h ; déconnexion, changement de mot de
  passe ou de 2FA n'invalident rien. → `sessionVersion` en base, comparée dans `requireAdmin`.
- [ ] 🟠 **IP du rate limit falsifiable** — `lib/client-ip.ts:8` prend la 1re valeur de `X-Forwarded-For` ; si le
  proxy ajoute au lieu de remplacer, les limites login / 2FA / contact sont contournables.
  → `X-Real-IP` posé par le proxy, ou dernière valeur de la liste.
- [ ] 🟠 **Formulaire = relais d'e-mails** — `contact/service.ts`, `contact-confirmation.ts` : confirmation envoyée à
  n'importe quelle adresse, avec nom/objet de l'attaquant, depuis le Gmail de l'entreprise (réputation, quota
  ~500/j). → Limite par e-mail destinataire ; pas de contenu libre dans le texte.
- [ ] 🟠 **Type MIME non vérifié sur le contenu** — `lib/uploads.ts:41`, `lib/public-image-upload.ts:28`.
  → Contrôle des octets magiques ; PDF en téléchargement seul si doute.
- [ ] 🟠 **Remplissage du disque** — 5 requêtes × 20 Mo / 15 min / IP (contournable via l'IP). → Quota global
  de stockage des pièces jointes.
- [ ] 🟢 **Pas de Content-Security-Policy** — `next.config.ts` (commentaire « viendra avec le proxy »). → `proxy.ts` avec nonce.
- [ ] 🟢 **JSON-LD non échappé** — `JSON.stringify` sans échapper `<` (`blog/[slug]/page.tsx:63`, `app/page.tsx`).
  → Remplacer `<` par `<`.
- [ ] 🟢 **Rejeu TOTP** possible dans la fenêtre 30-60 s (`totp.ts`). → Mémoriser le dernier compteur accepté.
- [ ] 🟢 **Verrouillage de compte déclenchable par un tiers** (5 échecs → 15 min, déni de service admin).
- [ ] 🟢 **HSTS `preload`** activé avant le choix du domaine (`next.config.ts:5`). → À activer une fois HTTPS stable.
- [ ] 🟢 **`leads.list()` sans pagination** (`features/leads/repository.ts:48`).
- [ ] 🟢 **Rate limiter en mémoire**, remis à zéro à chaque redémarrage (acceptable en instance unique).

**À conserver (points solides)** : argon2 + verrouillage + message générique ; 2FA avec codes de secours
hashés et jeton intermédiaire distinct ; revérification de session dans chaque action/route ; `server-only` +
règle ESLint ; Markdown `html:false` ; PJ hors `public/` (UUID, `nosniff`, `no-store`) ; Zod aux frontières ;
honeypot ; aucune donnée personnelle dans les logs ; secrets hors dépôt.

---

## 2. Bugs probables — à confirmer par un test réel, puis corriger

- [ ] 🔴 **Limite de corps des Server Actions = 1 Mo par défaut** — `next.config.ts` ne définit pas
  `experimental.serverActions.bodySizeLimit` : PJ (jusqu'à 20 Mo annoncés) et photos admin (5 Mo) risquent
  d'échouer. *Test : envoyer une PJ de 2 Mo.*
- [ ] 🔴 **Images uploadées en 404 en production** — `public/uploads/` alimenté au runtime ; `next start` ne sert
  en général que les fichiers présents au build. *Test : ajouter une réalisation après `next build && next start`.*
  → Servir `/uploads` par Caddy/Nginx, ou route dédiée.
- [ ] 🟠 `deleteRealisationAction` ne revalide pas `/realisations` (`features/realisations/actions.ts:83-88`).
- [ ] 🟢 Suppression d'article/réalisation : fichiers image orphelins laissés sur le disque.

---

## 3. Mécanismes manquants (fonctionnel)

### Demandes (leads)
- [ ] 🔴 **Notification e-mail à l'admin** à chaque nouvelle demande (seule la confirmation client part) —
  risque : demande inaperçue. S'ajoute dans `features/notifications/` via l'interface `Mailer`.
- [ ] 🟠 **Cycle de vie des leads** : statut « traité » (aujourd'hui `new`/`read`), suppression, pagination admin.
- [ ] 🟠 **Purge RGPD** automatique des demandes et pièces jointes anciennes (§8.4).
- [ ] 🟠 **Relances planifiées** + route cron protégée (`Authorization: Bearer`, comparaison en temps constant,
  lot borné, idempotence — §9).

### SEO local
- [ ] 🔴 **Pages `services/[slug]` et `zones/[city]`** (cœur du SEO local, §5.2) : gabarits +
  `generateStaticParams`, metadata, ajout au sitemap.
- [ ] 🟠 **JSON-LD local complet** : `geo`, `openingHoursSpecification`, `priceRange`, `areaServed` — aussi sur
  les pages service/zone (`app/page.tsx:41-63`).
- [ ] 🟠 **Open Graph / Twitter** sur l'accueil, `/blog`, `/realisations` (seul l'article en définit).
- [ ] 🟠 **Lien article → page service** : `blog/[slug]/page.tsx:88` renvoie vers `/#services`.
- [ ] 🟢 Titre de l'accueil trop générique (`app/page.tsx:24`, « Dépannage d'urgence ») — ajouter métier + ville.

### Pages techniques et conversion
- [ ] 🟠 `not-found.tsx` et `error.tsx` personnalisés (§5.3), avec liens utiles et numéro.
- [ ] 🟢 Page `/contact` dédiée (prévue §3.1).
- [ ] 🟢 Situation « C'est urgent » : libellé « Appeler maintenant » mais ancre vers `#contact`
  (`content/home.ts:20-21`) → lier `tel:` ou changer le libellé.
- [ ] 🟢 **Mesure des conversions** respectueuse de la vie privée (clic téléphone, soumission — §7bis.5),
  soumise au consentement ; dépendance à valider avant ajout.

---

## 4. Performance

- [ ] 🔴 **Images sources ~2 Mo en PNG** (`public/images/technicien-*.png`, règle ≤ 200 Ko) — hero = LCP
  (`HeroSection.tsx:12`) et `WhyUsSection.tsx:20` ; optimisation à froid coûteuse sur le VPS après chaque
  déploiement. → Convertir en WebP/AVIF ~150 Ko en amont.
- [ ] 🟠 **E-mail SMTP dans la requête du formulaire** (3 tentatives + backoff, `smtp-mailer.ts`,
  `contact/service.ts:22`) : attente de plusieurs secondes possible. → Envoyer après la réponse (`after()`).
- [ ] 🟠 **Geist Mono chargée sur toutes les pages** (`app/layout.tsx:13`) alors qu'utilisée seulement dans
  l'admin (`TotpEnrollment.tsx:39`). → La charger dans le layout admin uniquement.
- [ ] 🟠 **`/blog` dynamique** à cause de `searchParams` (`blog/page.tsx:19`). → Pagination par segment
  (`/blog/page/2`) + ISR.
- [ ] 🟢 `RealisationsGrid` entièrement Client Component : grille serveur + petit îlot client pour la modal.
- [ ] 🟢 `sizes="100vw"` pour une image bornée à `max-w-6xl` (`WhyUsSection.tsx:23`).
- [ ] 🟢 Uploads admin non recompressés (jusqu'à 5 Mo) : redimensionner/limiter à l'envoi.
- [ ] 🟢 **Mesurer** : `next build` (budget JS ≤ 150 Ko/page, `@mdxeditor/editor` déjà en `next/dynamic`) puis
  Lighthouse mobile — aucune valeur FCP/LCP/CLS/INP/TBT disponible à ce jour.

---

## 5. Exploitation / déploiement

- [ ] 🔴 **Initialiser Git** (aucun historique ni retour arrière aujourd'hui), branche `feat/…` (§11).
- [ ] 🔴 Process Node géré (systemd ou PM2) avec fichier d'environnement en permissions `600`.
- [ ] 🔴 Reverse proxy HTTPS (Caddy/Nginx) : HTTP → HTTPS, www → domaine canonique, en-tête IP fiable
  (cf. §1), service de `/uploads` (cf. §2).
- [ ] 🔴 **Sauvegardes chiffrées** de `data/` (via `sqlite3 .backup`/`VACUUM INTO`, jamais copie à chaud) et
  de `public/uploads/`, stockées hors VPS, avec test de restauration.
- [ ] 🟠 Cron système pour les relances et la purge RGPD (cf. §3).
- [ ] 🟠 VPS en France/UE, SSH par clés, pare-feu 80/443 + SSH, chiffrement du disque (§8.4).
- [ ] 🟢 Détection de secrets en pre-commit (gitleaks — à valider avant ajout, §2).

---

## 6. Tests et qualité

- [ ] 🟠 **Tests d'intégration** sur SQLite temporaire (repositories leads, articles, réalisations, utilisateurs).
- [ ] 🟠 **E2E Playwright + axe-core** : accueil, contact (vide/erreur/succès), connexion admin, publication
  d'article ; échec sur violation `serious`/`critical`. *(dépendances à valider)*
- [ ] 🟠 **Lighthouse CI** : perf ≥ 0,95, a11y = 1, SEO = 1, LCP ≤ 2500, CLS ≤ 0,1.
- [ ] 🟢 Prettier + `jsx-a11y` strict (aujourd'hui seulement via la config Next).
- [ ] 🟢 Points a11y à vérifier à l'axe : `aria-live="assertive"` permanent sur la zone d'erreur du formulaire
  (`ContactForm.tsx:177`), contraste du texte clair sur le voile du hero, `<main id="contenu">` répété par page.
- [ ] 🟢 Tests unitaires manquants : JSON-LD des articles, limites d'upload, service de contact.

---

## 7. Ménage (à valider avant toute suppression — règle du projet)

- [ ] `src/components/ui/Mascot.tsx`, `HeroGlow.tsx`, `illustrations.tsx` — inutilisés (essai abandonné).
- [ ] `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` — reliquats du template Next.
- [ ] `image.png` à la racine du projet — usage non identifié.
- [ ] `tsconfig.tsbuildinfo` — fichier généré (déjà ignoré par Git).
- [ ] CLAUDE.md section 4 (principe D) cite encore « Prisma » alors que le projet utilise Drizzle.

---

## 8. Contenu du site (en dernier — dépend du client)

### 8.1 Informations à fournir — `TODO-CONTENU.md`
- [ ] 🔴 **Nom de domaine définitif** — débloque `metadataBase` (`app/layout.tsx:20`), canonicals, sitemap
  (vide tant que le domaine est un TODO, `app/sitemap.ts:11`), `robots.txt`, URL du JSON-LD.
- [ ] 🔴 **Raison sociale + SIRET** (`config/site.ts:10-11`) — footer, JSON-LD, mentions légales.
- [ ] 🔴 **Adresse : rue + code postal** (`config/site.ts:27-28`) — NAP, footer, JSON-LD.
- [ ] 🟠 **Délai de réponse annoncé** (`content/home.ts:9`, bandeau sous le hero).
- [ ] 🟠 **Années d'expérience**, **délai de rappel garanti**, **assurances et certifications**
  (`content/home.ts:98,102,106`).
- [ ] 🟠 Horaires d'ouverture / disponibilité 24h/24 (nécessaires au JSON-LD, §5.2) — *à demander au client*.
- [ ] 🟢 Reporter chaque réponse dans `config/site.ts` / `content/home.ts` ; les TODO restent visibles plutôt
  qu'inventés (comportement conforme à conserver).

### 8.2 Textes juridiques
- [ ] 🔴 **Mentions légales** (page + lien dans `SiteFooter.tsx:25`, aujourd'hui texte brut non cliquable).
- [ ] 🔴 **Politique de confidentialité** : finalités, durée de conservation, droits RGPD, sous-traitants
  (hébergeur, Gmail SMTP).
- [ ] 🔴 **Mention d'information sous le formulaire** de contact (`ContactForm.tsx`).

### 8.3 Contenus éditoriaux et visuels
- [ ] 🟠 Textes réels (≥ 300 mots) pour chaque page service (chauffage, climatisation, plomberie) et chaque
  zone (Cannes, Antibes, Nice) — pas de pages dupliquées avec un mot changé.
- [ ] 🟠 Confirmer que `public/images/technicien-*.png` sont de **vraies photos** de l'équipe (§7bis.2).
- [ ] 🟢 Transparence du prix (forfait de déplacement / fourchette) si le client la valide (§7bis.2).
- [ ] 🟢 Nouveaux avis Google à copier tels quels depuis la fiche (3 avis aujourd'hui).
- [ ] 🟢 Premiers articles de blog (un par intention de recherche, contenu vérifiable).

---

## Limites de l'audit

- Lecture statique : rien n'a été exécuté (build, tests, lint, typecheck, Lighthouse, axe).
- Les deux « bugs probables » (§2) sont des hypothèses fondées sur le comportement documenté de Next.js :
  à confirmer par un test réel avant correction.
- Fichiers volontairement non lus : `.env`, contenu de `data/` (règle 8.5 du CLAUDE.md).
- Les pages admin ont été auditées via leurs actions et gardes, pas ligne à ligne dans leur rendu.
