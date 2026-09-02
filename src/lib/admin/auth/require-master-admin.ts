import "server-only";

import type {
  User,
} from "@supabase/supabase-js";

import {
  createSupabaseAuthServerClient,
} from "@/lib/admin/supabase/auth-server";


/* =========================================================
   LYNUX ADMIN CORE
   MASTER ADMIN AUTHORIZATION

   RULE:

   Authentication answers:
     "Who is this user?"

   Authorization answers:
     "Is this user allowed to control Admin Core?"

   A valid Supabase session alone is NOT enough.
========================================================= */


export class AdminAuthError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      "AdminAuthError";

    this.status =
      status;
  }
}


/* =========================================================
   MASTER ADMIN EMAIL ALLOWLIST

   Expected environment variable:

   LYNUX_MASTER_ADMIN_EMAILS

   Example:

   LYNUX_MASTER_ADMIN_EMAILS=owner@example.com

   Multiple emails:

   LYNUX_MASTER_ADMIN_EMAILS=owner@example.com,backup@example.com

   Emails are normalized to lowercase.
========================================================= */

function getMasterAdminEmails(): Set<string> {
  const raw =
    process.env
      .LYNUX_MASTER_ADMIN_EMAILS;

  if (!raw) {
    throw new Error(
      "Missing LYNUX_MASTER_ADMIN_EMAILS."
    );
  }

  const emails =
    raw
      .split(",")
      .map(
        (email) =>
          email
            .trim()
            .toLowerCase()
      )
      .filter(Boolean);

  if (
    emails.length === 0
  ) {
    throw new Error(
      "LYNUX_MASTER_ADMIN_EMAILS contains no valid email addresses."
    );
  }

  return new Set(
    emails
  );
}


/* =========================================================
   REQUIRE MASTER ADMIN

   SECURITY FLOW:

   1. Read the signed-in Supabase user from the server.
   2. Do NOT trust client-provided user IDs or emails.
   3. Require a verified server-side user.
   4. Check that user's email against the master allowlist.
   5. Return the trusted Supabase User object.

   This function does NOT use the service-role client.
========================================================= */

export async function requireMasterAdmin(): Promise<User> {
  const supabase =
    await createSupabaseAuthServerClient();

  const {
    data,
    error,
  } =
    await supabase.auth.getUser();

  if (
    error ||
    !data.user
  ) {
    throw new AdminAuthError(
      "Authentication required.",
      401
    );
  }

  const email =
    data.user.email
      ?.trim()
      .toLowerCase();

  if (!email) {
    throw new AdminAuthError(
      "Authenticated user has no email address.",
      403
    );
  }

  const allowedEmails =
    getMasterAdminEmails();

  if (
    !allowedEmails.has(
      email
    )
  ) {
    throw new AdminAuthError(
      "Master administrator access required.",
      403
    );
  }

  return data.user;
}