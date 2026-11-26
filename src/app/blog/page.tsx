import type { Metadata } from "next";

import {
  ARTICLES_PER_PAGE,
  BLOG_DESCRIPTION,
  BlogArticleList,
  blogTotalPages,
  drizzleArticleRepository,
} from "@/features/articles";

export const metadata: Metadata = {
  title: "Blog",
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
};

// Page 1, préparée à l'avance (aucune lecture de l'adresse) et rafraîchie à la publication (revalidatePath).
export default async function BlogPage() {
  const [articles, total] = await Promise.all([
    drizzleArticleRepository.listPublished(ARTICLES_PER_PAGE, 0),
    drizzleArticleRepository.countPublished(),
  ]);

  return <BlogArticleList articles={articles} page={1} totalPages={blogTotalPages(total)} />;
}
