import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  setCoverImage: vi.fn(),
  validateImage: vi.fn(),
  storeImage: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/admin-auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/features/articles/repository", () => ({
  drizzleArticleRepository: { findById: mocks.findById, update: mocks.update, setCoverImage: mocks.setCoverImage },
}));
vi.mock("@/lib/public-image-upload", () => ({
  validatePublicImage: mocks.validateImage,
  storePublicImage: mocks.storeImage,
}));

import { updateArticleAction } from "@/features/articles/actions";

function form(extra: Record<string, string | File> = {}): FormData {
  const data = new FormData();
  const fields = {
    id: "1",
    title: "Entretenir sa chaudière",
    slug: "entretenir-sa-chaudiere",
    description: "Les gestes utiles avant l'hiver.",
    body: "Contenu de l'article.",
    authorName: "Nova Chauffage",
    relatedServiceSlug: "",
    ...extra,
  };
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const photo = () => new File([new Uint8Array([1])], "photo.jpg", { type: "image/jpeg" });
const refreshedPaths = () => mocks.revalidatePath.mock.calls.map((call) => call[0]);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findById.mockResolvedValue({ id: 1, status: "published", slug: "entretenir-sa-chaudiere" });
});

describe("updateArticleAction : rafraîchissement des pages publiques", () => {
  it("rafraîchit la liste, ses pages suivantes et l'article après un enregistrement", async () => {
    expect(await updateArticleAction(null, form())).toEqual({ ok: true, id: 1 });

    expect(refreshedPaths()).toEqual(
      expect.arrayContaining(["/blog", "/blog/page/[page]", "/blog/entretenir-sa-chaudiere"]),
    );
  });

  it("rafraîchit quand même si le texte alternatif de la photo manque", async () => {
    const result = await updateArticleAction(null, form({ coverImage: photo() }));

    expect(result).toHaveProperty("error");
    expect(refreshedPaths()).toContain("/blog");
  });

  it("rafraîchit quand même si la photo est refusée", async () => {
    mocks.validateImage.mockResolvedValue({ ok: false, error: "Format non accepté." });

    const result = await updateArticleAction(null, form({ coverImage: photo(), coverImageAlt: "Chaudière" }));

    expect(result).toEqual({ error: "Format non accepté." });
    expect(refreshedPaths()).toContain("/blog");
  });

  it("rafraîchit quand même si l'écriture de la photo échoue", async () => {
    mocks.validateImage.mockResolvedValue({ ok: true, file: photo() });
    mocks.storeImage.mockRejectedValue(new Error("disque plein"));

    await expect(
      updateArticleAction(null, form({ coverImage: photo(), coverImageAlt: "Chaudière" })),
    ).rejects.toThrow();
    expect(refreshedPaths()).toContain("/blog");
  });

  it("ne rafraîchit rien si le texte n'a pas été enregistré", async () => {
    mocks.update.mockRejectedValue(new Error("slug pris"));

    expect(await updateArticleAction(null, form())).toHaveProperty("error");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
