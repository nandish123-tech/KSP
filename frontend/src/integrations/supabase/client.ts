// Supabase removed - all data now comes from FastAPI AppSail backend
// This stub prevents import errors in files that still reference supabase

const noop = () => Promise.resolve({ data: null, error: { message: "Supabase removed. Use FastAPI backend." } });

export const supabase = new Proxy({} as any, {
  get(_, prop) {
    if (prop === "from") return () => ({ select: noop, eq: noop, order: noop, limit: noop });
    if (prop === "rpc")  return () => Promise.resolve({ data: null, error: { message: "Use FastAPI backend instead of Supabase RPC." } });
    if (prop === "auth") return { getUser: noop, signIn: noop, signOut: noop };
    return noop;
  },
});
