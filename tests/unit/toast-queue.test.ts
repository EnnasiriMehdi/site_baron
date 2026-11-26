import { describe, expect, it } from "vitest";

import {
  MAX_VISIBLE_TOASTS,
  SUCCESS_DISMISS_MS,
  addToast,
  initialQueueState,
  queueReducer,
  autoDismissMs,
  remainingAfterPause,
  removeToast,
  visibleToasts,
  type Toast,
} from "@/components/ui/toast/toast-queue";

const toast = (id: number, kind: Toast["kind"] = "info"): Toast => ({ id, kind, message: `message ${id}` });

describe("autoDismissMs", () => {
  it("laisse les erreurs et avertissements jusqu'au clic", () => {
    expect(autoDismissMs("error")).toBeNull();
    expect(autoDismissMs("warning")).toBeNull();
  });

  it("ferme seuls les succès et les infos", () => {
    expect(autoDismissMs("success")).toBe(SUCCESS_DISMISS_MS);
    expect(autoDismissMs("info")).toBe(SUCCESS_DISMISS_MS);
  });
});

describe("file de toasts", () => {
  it("ajoute à la fin, dans l'ordre d'arrivée", () => {
    const list = addToast(addToast([], toast(1)), toast(2));

    expect(list.map((item) => item.id)).toEqual([1, 2]);
  });

  it("retire un toast par identifiant sans toucher aux autres", () => {
    const list = removeToast([toast(1), toast(2), toast(3)], 2);

    expect(list.map((item) => item.id)).toEqual([1, 3]);
  });

  it("ne modifie pas la liste d'origine", () => {
    const original = [toast(1)];

    addToast(original, toast(2));
    removeToast(original, 1);

    expect(original).toHaveLength(1);
  });

  it("n'affiche que les premiers : les autres attendent leur tour", () => {
    const list = Array.from({ length: MAX_VISIBLE_TOASTS + 2 }, (_, index) => toast(index + 1));

    expect(visibleToasts(list)).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(visibleToasts(list).map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("fait avancer la file quand un toast visible est fermé", () => {
    const list = [toast(1), toast(2), toast(3), toast(4)];

    expect(visibleToasts(removeToast(list, 1)).map((item) => item.id)).toEqual([2, 3, 4]);
  });
});

describe("remainingAfterPause", () => {
  it("retranche le temps déjà écoulé", () => {
    expect(remainingAfterPause(6000, 1000, 3500)).toBe(3500);
  });

  it("ne descend jamais sous zéro", () => {
    expect(remainingAfterPause(1000, 0, 5000)).toBe(0);
  });
});

describe("queueReducer", () => {
  it("attribue des identifiants croissants et uniques", () => {
    let state = initialQueueState;
    state = queueReducer(state, { type: "add", kind: "error", message: "a" });
    state = queueReducer(state, { type: "add", kind: "success", message: "b" });

    expect(state.toasts.map((item) => item.id)).toEqual([1, 2]);
    expect(state.nextId).toBe(3);
  });

  it("garde le message et le type tels que fournis", () => {
    const state = queueReducer(initialQueueState, { type: "add", kind: "warning", message: "Attention" });

    expect(state.toasts[0]).toEqual({ id: 1, kind: "warning", message: "Attention" });
  });

  it("ne réutilise jamais un identifiant après une fermeture", () => {
    let state = queueReducer(initialQueueState, { type: "add", kind: "info", message: "a" });
    state = queueReducer(state, { type: "dismiss", id: 1 });
    state = queueReducer(state, { type: "add", kind: "info", message: "b" });

    expect(state.toasts.map((item) => item.id)).toEqual([2]);
  });

  it("ignore la fermeture d'un toast inexistant", () => {
    const state = queueReducer(initialQueueState, { type: "dismiss", id: 99 });

    expect(state.toasts).toEqual([]);
  });
});
