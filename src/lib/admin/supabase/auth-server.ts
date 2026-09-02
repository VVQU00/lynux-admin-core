import "server-only";

import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import {
  cookies,
} from "next/headers";


export async function createSupabaseAuthServerClient() {
  const cookieStore =
    await cookies();

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!publishableKey) {
    throw new Error(
      "Missing Supabase publishable or anon key."
    );
  }

  return createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>
        ) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            /*
             * Server Components can read cookies
             * but may not always be allowed to
             * modify them.
             */
          }
        },
      },
    }
  );
}