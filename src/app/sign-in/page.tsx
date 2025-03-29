"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { signInAction } from "../actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    if (loading) return;
    setLoading(true);

    try {
      const response = await signInAction(formData);

      if (response.error) {
        const { status, message } = response.error;

        let title = "Sign in failed";
        let description = message;

        switch (status) {
          case 429:
            title = "Too many attempts";
            description = "Please wait a few minutes before trying again";
            break;
          case 400:
            title = "Invalid credentials";
            description = "Please check your email and password";
            break;
          default:
            description = message || "An unexpected error occurred";
        }

        toast({
          variant: "destructive",
          title,
          description,
        });
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign in error:", err);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="bg-background"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                className="bg-background"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full relative"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="absolute left-3 h-4 w-4 animate-spin" />
                  <span className="ml-6">Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Create one now
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
