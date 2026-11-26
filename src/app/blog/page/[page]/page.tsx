import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  ARTICLES_PER_PAGE,
  BLOG_DESCRIPTION,
  BlogArticleList,
  blogPageHref,
  blogTotalPages,
  drizzleArticleRepository,
  parseBlogPage,
} from "@/features/articles";

type Props = { params: Promise<{ page: string }> };

// Une page apparue après le build est générée à la première visite, puis gardée.
export const dynamicParams = true;

// Pages 2 à N : la page 1 est /blog.
export async function generateStaticParams() {
  const pages = blogTotalPages(await drizzleArticleRepository.countPublished());
  return Array.from({ length: pages - 1 }, (_, index) => ({ page: String(index + 2) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: raw } = await params;
  const pages = blogTotalPages(await drizzleArticleRepository.countPublished());
  const page = parseBlogPage(raw, pages);
  if (page === null) return {};

  return {
    title: `Blog – page ${page}`,
    description: BLOG_DESCRIPTION,
    alternates: { canonical: blogPageHref(page) },
  };
}

export default async function BlogPaginatedPage({ params }: Props) {
  const { page: raw } = await params;
  // /blog/page/1 serait un doublon de /blog.
  if (raw === "1") permanentRedirect(blogPageHref(1));

  const totalPages = blogTotalPages(await drizzleArticleRepository.countPublished());
  const page = parseBlogPage(raw, totalPages);
  if (page === null) notFound();

  const articles = await drizzleArticleRepository.listPublished(ARTICLES_PER_PAGE, (page - 1) * ARTICLES_PER_PAGE);

  return <BlogArticleList articles={articles} page={page} totalPages={totalPages} />;
}
