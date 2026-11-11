"use client";

import "@mdxeditor/editor/style.css";
import {
  BoldItalicUnderlineToggles,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";

import { uploadArticleImageAction } from "../actions";

// Envoie le fichier à la Server Action (même allowlist que la couverture d'article : JPG/PNG/WEBP,
// 5 Mo, cf. uploadArticleImageAction) et laisse MDXEditor insérer `![alt](url)` à l'endroit du
// curseur — toujours du Markdown en base, jamais du HTML stocké (CLAUDE.md, 7ter.2).
async function imageUploadHandler(image: File): Promise<string> {
  const result = await uploadArticleImageAction(image);
  if (!result.ok) throw new Error(result.error);
  return result.url;
}

type MDXEditorClientProps = {
  markdown: string;
  onChange: (markdown: string) => void;
};

// Chargé uniquement côté client via next/dynamic (ssr:false dans ArticleEditor.tsx) : l'éditeur
// dépend du DOM et n'a aucune raison de faire partie du rendu serveur ou du bundle public.
export default function MDXEditorClient({ markdown, onChange }: MDXEditorClientProps) {
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      contentEditableClassName="article-body min-h-64 px-3 py-2"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        imagePlugin({ imageUploadHandler }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <InsertImage />
            </>
          ),
        }),
      ]}
    />
  );
}
