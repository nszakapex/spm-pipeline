import { cache } from "react";
import { hydratePersistedActivities } from "@/lib/db/activity-persist";
import { hydrateStoreFromSupabase } from "@/lib/db/supabase-persist";

/** Load overnight overlay from Supabase, then replay the signed activity cookie. */
export const hydratePipelineForRequest = cache(async function hydratePipelineForRequest() {
  try {
    await hydrateStoreFromSupabase();
  } catch {
    // Persist is optional for the demo board. A down store must not blank Home.
  }
  await hydratePersistedActivities();
});
