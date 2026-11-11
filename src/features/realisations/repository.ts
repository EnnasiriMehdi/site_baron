import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { realisationPhotos, realisations, type Realisation, type RealisationPhoto } from "@/lib/db/schema";

export type NewRealisationInput = {
  title: string;
  description: string;
  photoPath: string;
  photoAlt: string;
  relatedServiceSlug?: string;
};

export type NewRealisationPhotoInput = {
  photoPath: string;
  photoAlt: string;
  position: number;
};

// Photo principale + photos supplémentaires, ordonnées pour le carousel de la modal.
export type RealisationWithPhotos = Realisation & { photos: RealisationPhoto[] };

export interface RealisationRepository {
  create(input: NewRealisationInput): Promise<number>;
  addPhoto(realisationId: number, photo: NewRealisationPhotoInput): Promise<void>;
  list(limit?: number): Promise<Realisation[]>;
  listPhotos(realisationId: number): Promise<RealisationPhoto[]>;
  listWithPhotos(limit?: number): Promise<RealisationWithPhotos[]>;
  countAll(): Promise<number>;
  findById(id: number): Promise<Realisation | undefined>;
  delete(id: number): Promise<void>;
}

export const drizzleRealisationRepository: RealisationRepository = {
  async create(input) {
    const result = getDb().insert(realisations).values(input).run();
    return Number(result.lastInsertRowid);
  },

  async addPhoto(realisationId, photo) {
    getDb()
      .insert(realisationPhotos)
      .values({ realisationId, ...photo })
      .run();
  },

  async list(limit) {
    const query = getDb().select().from(realisations).orderBy(desc(realisations.createdAt));
    return limit ? query.limit(limit) : query;
  },

  async listPhotos(realisationId) {
    return getDb()
      .select()
      .from(realisationPhotos)
      .where(eq(realisationPhotos.realisationId, realisationId))
      .orderBy(realisationPhotos.position);
  },

  async listWithPhotos(limit) {
    const items = await this.list(limit);
    return Promise.all(
      items.map(async (item) => ({ ...item, photos: await this.listPhotos(item.id) })),
    );
  },

  async countAll() {
    const [row] = await getDb().select({ value: count() }).from(realisations);
    return row?.value ?? 0;
  },

  async findById(id) {
    const [realisation] = await getDb().select().from(realisations).where(eq(realisations.id, id)).limit(1);
    return realisation;
  },

  async delete(id) {
    await getDb().delete(realisations).where(eq(realisations.id, id));
  },
};
