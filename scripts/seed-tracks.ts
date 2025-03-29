import { createClient } from "@supabase/supabase-js";
import tracks from "../src/app/tracks/tracks.json";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTracks() {
  console.log("Starting tracks seeding process...");

  // Prepare tracks data - remove id since it's now auto-generated
  const tracksToInsert = tracks.map((track) => ({
    name: track.name,
    description: track.desc,
    longitude: track.lon,
    latitude: track.lat,
    slug: track.slug,
    status: track.status || 1,
  }));

  console.log(`Preparing to insert ${tracksToInsert.length} tracks...`);

  // Insert in batches of 100 to avoid timeouts
  const batchSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < tracksToInsert.length; i += batchSize) {
    const batch = tracksToInsert.slice(i, i + batchSize);
    console.log(`Inserting batch ${i / batchSize + 1}...`);

    const { data, error } = await supabase
      .from("tracks")
      .insert(batch)
      .select();

    if (error) {
      console.error("Error seeding tracks batch:", error);
      throw error;
    }

    if (data) {
      insertedCount += data.length;
      console.log(`Successfully inserted ${data.length} tracks in this batch`);
    }
  }

  console.log(`Completed seeding. Total tracks inserted: ${insertedCount}`);
}

seedTracks().catch((error) => {
  console.error("Failed to seed tracks:", error);
  process.exit(1);
});
