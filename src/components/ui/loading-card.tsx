"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LoadingCardProps {
  title?: string;
}

export function LoadingCard({ title }: LoadingCardProps) {
  return (
    <Card className="animate-in fade-in-50 duration-500 ease-out">
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex justify-center py-8">
        <LoadingSpinner />
      </CardContent>
    </Card>
  );
}
