import "server-only";

import { createAuthService } from "./auth-service";
import { drizzleAdminUserRepository } from "./user-repository";

// Point d'assemblage (composition root) : c'est ici seulement que l'implémentation concrète est injectée.
export const authService = createAuthService(drizzleAdminUserRepository);
