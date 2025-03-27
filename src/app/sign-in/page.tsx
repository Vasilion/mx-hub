"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: error.title,
        description: error.description,
      });
      setError(null);
    }
  }, [error, toast]);

  useEffect(() => {
    if (success) {
      router.push("/");
      router.refresh();
      setSuccess(false);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await signIn(email, password);

      if (response.error) {
        let title = "Sign in failed";
        let description = response.error.message;

        if (response.error.status === 400) {
          title = "Invalid credentials";
          description = "Please check your email and password.";
        }

        setError({ title, description });
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="bg-background"
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
