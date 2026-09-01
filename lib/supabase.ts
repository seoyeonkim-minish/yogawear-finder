import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Null until the project is configured. Everything that touches an account
 * checks for null first, so the site — wishlist included — keeps working with
 * no Supabase project at all, and the existing tests keep running in Node.
 */
export const supabase = url && key ? createClient(url, key) : null;
