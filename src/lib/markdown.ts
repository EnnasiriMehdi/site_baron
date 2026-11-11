import MarkdownIt from "markdown-it";

/*
 * `html: false` (par défaut dans markdown-it, explicité ici) : toute balise HTML présente dans la
 * source est échappée en texte visible, jamais interprétée. C'est ce qui rend le rendu d'articles
 * sûr par construction (CLAUDE.md, 7ter.2 — « n'autorise pas le HTML brut »), sans liste blanche de
 * sanitisation à maintenir : pas de `<script>`, pas d'attribut `on*` possible depuis le corps.
 */
const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

export function renderArticleBody(markdown: string): string {
  return md.render(markdown);
}
