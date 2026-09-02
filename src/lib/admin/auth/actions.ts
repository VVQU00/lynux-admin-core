"use server";

import {
  redirect,
} from "next/navigation";

import {
  createSupabaseAuthServerClient,
} from "@/lib/admin/supabase/auth-server";


/* =========================================================
   LYNUX ADMIN CORE
   MASTER AUTH ACTIONS
========================================================= */


export async function signInMasterAdmin(
  formData: FormData
) {
  const email =
    String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

  const password =
    String(
      formData.get("password") ?? ""
    );

  if (
    !email ||
    !password
  ) {
    redirect(
      "/login?error=missing"
    );
  }

  const supabase =
    await createSupabaseAuthServerClient();

  const {
    error,
  } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    redirect(
      "/login?error=invalid"
    );
  }

  redirect("/");
}


/* =========================================================
   SIGN OUT
========================================================= */

export async function signOutMasterAdmin() {
  const supabase =
    await createSupabaseAuthServerClient();

  await supabase.auth.signOut();

  redirect("/login");
}