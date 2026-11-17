import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  NEW_LEAD_MAX_EMAILS,
  NEW_LEAD_WINDOW_MS,
  createNewLeadNotifier,
} from "@/features/contact/new-lead-notifier";

const notice = { leadId: 1, attachmentCount: 0 };

function setup(recipients: string[] = ["admin@exemple.test"]) {
  const sendNotification = vi.fn(async () => {});
  const sendLimitNotice = vi.fn(async () => {});
  const listRecipients = vi.fn(async () => recipients);
  const notify = createNewLeadNotifier({ listRecipients, sendNotification, sendLimitNotice, now: () => 0 });
  return { notify, sendNotification, sendLimitNotice, listRecipients };
}

describe("createNewLeadNotifier", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("envoie la notification à chaque compte admin lu en base", async () => {
    const { notify, sendNotification } = setup(["a@exemple.test", "b@exemple.test"]);

    await notify(notice);

    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledWith("a@exemple.test", notice);
    expect(sendNotification).toHaveBeenCalledWith("b@exemple.test", notice);
  });

  it("n'envoie rien (et ne plante pas) s'il n'y a aucun compte admin", async () => {
    const { notify, sendNotification } = setup([]);

    await expect(notify(notice)).resolves.toBeUndefined();

    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("au-delà du plafond : un seul avis « plafond atteint », puis le silence", async () => {
    const { notify, sendNotification, sendLimitNotice } = setup();

    for (let i = 0; i < NEW_LEAD_MAX_EMAILS + 20; i += 1) await notify(notice);

    expect(sendNotification).toHaveBeenCalledTimes(NEW_LEAD_MAX_EMAILS);
    expect(sendLimitNotice).toHaveBeenCalledTimes(1);
  });

  it("reprend les notifications individuelles à la fenêtre suivante", async () => {
    let now = 0;
    const sendNotification = vi.fn(async () => {});
    const notify = createNewLeadNotifier({
      listRecipients: async () => ["admin@exemple.test"],
      sendNotification,
      sendLimitNotice: async () => {},
      now: () => now,
    });

    for (let i = 0; i < NEW_LEAD_MAX_EMAILS + 1; i += 1) await notify(notice);
    now = NEW_LEAD_WINDOW_MS;
    await notify(notice);

    expect(sendNotification).toHaveBeenCalledTimes(NEW_LEAD_MAX_EMAILS + 1);
  });

  it("ne lève jamais d'erreur si l'envoi échoue", async () => {
    const notify = createNewLeadNotifier({
      listRecipients: async () => ["admin@exemple.test"],
      sendNotification: async () => {
        throw new Error("SMTP down");
      },
      sendLimitNotice: async () => {},
      now: () => 0,
    });

    await expect(notify(notice)).resolves.toBeUndefined();
  });

  it("ne lève jamais d'erreur si la lecture des destinataires échoue", async () => {
    const notify = createNewLeadNotifier({
      listRecipients: async () => {
        throw new Error("database is locked");
      },
      sendNotification: async () => {},
      sendLimitNotice: async () => {},
      now: () => 0,
    });

    await expect(notify(notice)).resolves.toBeUndefined();
  });

  it("ne journalise ni l'adresse de l'admin ni le message d'erreur", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const notify = createNewLeadNotifier({
      listRecipients: async () => ["secret-admin@exemple.test"],
      sendNotification: async () => {
        throw new Error("refus pour secret-admin@exemple.test");
      },
      sendLimitNotice: async () => {},
      now: () => 0,
    });

    await notify(notice);

    expect(JSON.stringify(logged.mock.calls)).not.toContain("secret-admin");
  });
});
