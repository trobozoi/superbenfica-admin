import "server-only";
import { parseServerEnv } from "@/config/env";

/** Variáveis que só existem no servidor (nunca vão para o bundle do navegador). */
export const serverEnv = parseServerEnv({ API_URL: process.env.API_URL });
