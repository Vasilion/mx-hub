"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const supabase = createClientComponentClient<Database>({
  supabaseUrl: "https://dxdoxsiegyvdooogbe.supabase.co",
  supabaseKey:
    "NeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZG94c2llZ3l2ZG9vb2diZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA5MDk0MjY5LCJleHAiOjIwMjQ2NzAyNjl9.ZStlnJlZiiGmR42G94c2JF2cFsmRzb29Z",
});
