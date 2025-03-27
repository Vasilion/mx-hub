"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();
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
      toast({
        title: "Account created",
        description: "You have been successfully signed in.",
      });
      setSuccess(false);
      router.push("/");
      router.refresh();
    }
  }, [success, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await signUp(email, password);
      console.log("Sign up response:", response);

      if (response.error) {
        console.log("Sign up error:", response.error);
        let title = "Sign up failed";
        let description =
          response.error.message || "An error occurred during sign up";

        if (response.error.status === 429) {
          title = "Too many attempts";
          description = "Please wait a moment before trying again.";
        } else if (
          response.error.code === "user_already_exists" ||
          response.error.status === 422
        ) {
          title = "Email already registered";
          description = "Please sign in instead or use a different email.";
        }

        setError({ title, description });
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          </div>
          <CardDescription>
            Join MX Hub and start tracking your motocross journey
          </CardDescription>
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
                placeholder="Create a secure password"
                className="bg-background"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 relative"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="absolute left-3 h-4 w-4 animate-spin" />
                  <span className="ml-6">Creating account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary hover:underline font-medium"
            >
              Sign in instead
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
