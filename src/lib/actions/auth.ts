import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function signInAction(data: { email: string; password: string }) {
  const supabase = createServerActionClient<Database>({ cookies });

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: { message: error.message, status: error.status } };
  }

  return { error: null };
}

export async function signUpAction(data: { email: string; password: string }) {
  const supabase = createServerActionClient<Database>({ cookies });

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: { message: error.message, status: error.status } };
  }

  return { error: null };
}

export async function signOutAction() {
  const supabase = createServerActionClient<Database>({ cookies });
  await supabase.auth.signOut();
}
