import "server-only";

import { getMailer } from "@/lib/mailer";
import { createNotificationService } from "./service";

// Point d'assemblage (composition root) : seule implémentation concrète injectée.
export const notificationService = createNotificationService(getMailer());
