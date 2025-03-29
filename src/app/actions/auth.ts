"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function signInAction(data: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  const email = data.get("email") as string;
  const password = data.get("password") as string;

  try {
    // Clear any existing sessions first
    await supabase.auth.signOut();
    await delay(500); // Add a small delay after signout

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    console.log("Current session before sign in:", sessionData);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error details:", {
        status: error.status,
        message: error.message,
        name: error.name,
      });

      if (error.status === 429) {
        return {
          error: {
            message:
              "Too many sign in attempts. Please try again in a few minutes.",
            status: 429,
          },
        };
      }

      return {
        error: {
          message: error.message || "Authentication failed",
          status: error.status || 400,
        },
      };
    }

    console.log("Sign in successful:", authData);
    return { error: null, data: authData };
  } catch (error: any) {
    console.error("Unexpected error during sign in:", error);
    return {
      error: {
        message: "An unexpected error occurred during sign in",
        status: 500,
      },
    };
  }
}

export async function signUpAction(data: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  const email = data.get("email") as string;
  const password = data.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: {
        code: error.status === 422 ? "user_already_exists" : error.status,
        message: error.message || "An error occurred during sign up",
        status: error.status,
      },
    };
  }

  return { error: null };
}

export async function signOutAction() {
  const supabase = createServerActionClient<Database>({ cookies });
  await supabase.auth.signOut();
}
