import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { articles, type Article } from "@/lib/db/schema";

export type ArticleFields = {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorName: string;
  relatedServiceSlug?: string;
};

export interface ArticleRepository {
  create(input: ArticleFields): Promise<number>;
  update(id: number, input: ArticleFields): Promise<void>;
  setCoverImage(id: number, path: string, alt: string): Promise<void>;
  publish(id: number): Promise<void>;
  unpublish(id: number): Promise<void>;
  delete(id: number): Promise<void>;
  list(): Promise<Article[]>;
  listPublished(limit: number, offset: number): Promise<Article[]>;
  countPublished(): Promise<number>;
  findBySlugPublished(slug: string): Promise<Article | undefined>;
  findById(id: number): Promise<Article | undefined>;
}

export const drizzleArticleRepository: ArticleRepository = {
  async create(input) {
    const result = getDb().insert(articles).values(input).run();
    return Number(result.lastInsertRowid);
  },

  async update(id, input) {
    await getDb()
      .update(articles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(articles.id, id));
  },

  async setCoverImage(id, path, alt) {
    await getDb()
      .update(articles)
      .set({ coverImagePath: path, coverImageAlt: alt, updatedAt: new Date() })
      .where(eq(articles.id, id));
  },

  async publish(id) {
    const existing = await drizzleArticleRepository.findById(id);
    await getDb()
      .update(articles)
      .set({
        status: "published",
        // publiée une première fois : publishedAt se fige, une republication ne le change pas.
        publishedAt: existing?.publishedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id));
  },

  async unpublish(id) {
    await getDb().update(articles).set({ status: "draft", updatedAt: new Date() }).where(eq(articles.id, id));
  },

  async delete(id) {
    await getDb().delete(articles).where(eq(articles.id, id));
  },

  async list() {
    return getDb().select().from(articles).orderBy(desc(articles.createdAt));
  },

  async listPublished(limit, offset) {
    return getDb()
      .select()
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
  },

  async countPublished() {
    const [row] = await getDb().select({ value: count() }).from(articles).where(eq(articles.status, "published"));
    return row?.value ?? 0;
  },

  async findBySlugPublished(slug) {
    const [article] = await getDb()
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .limit(1);
    return article;
  },

  async findById(id) {
    const [article] = await getDb().select().from(articles).where(eq(articles.id, id)).limit(1);
    return article;
  },
};
