"use client";

import { MainLayout } from "@/components/layout/main-layout";
import TrackSearch from "@/components/tracks/TrackSearch";

export default function TracksPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Tracks</h1>
        <TrackSearch />
      </div>
    </MainLayout>
  );
}
