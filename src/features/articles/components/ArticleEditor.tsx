"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const MDXEditorClient = dynamic(() => import("./MDXEditorClient"), {
  ssr: false,
  loading: () => (
    <p className="rounded-(--radius-md) border border-(--color-border) px-3 py-2 text-sm text-(--color-text-muted)">
      Chargement de l&apos;éditeur…
    </p>
  ),
});

type ArticleEditorProps = {
  name: string;
  defaultValue: string;
};

// Le corps reste du Markdown en base (jamais du HTML, CLAUDE.md 7ter.2) : l'éditeur WYSIWYG édite
// ce Markdown nativement, le champ caché ci-dessous est ce que le formulaire soumet réellement.
export function ArticleEditor({ name, defaultValue }: ArticleEditorProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-surface)">
      <input type="hidden" name={name} value={value} />
      <MDXEditorClient markdown={defaultValue} onChange={setValue} />
    </div>
  );
}
