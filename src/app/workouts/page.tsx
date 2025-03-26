"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Exercise {
  id: string;
  workout_id: string;
  type: "cardio" | "strength";
  name: string;
  reps?: number;
  weight?: number;
  duration?: number;
  created_at: string;
}

interface Workout {
  id: string;
  title: string;
  date: string;
  created_at: string;
  exercises: Exercise[];
}

type WorkoutType = "cardio" | "strength" | null;

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<WorkoutType>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    reps: "",
    weight: "",
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  async function fetchWorkouts() {
    const { data: userData } = await supabase.auth.getUser();

    // Fetch workouts
    const { data: workoutsData, error: workoutsError } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userData.user?.id)
      .order("date", { ascending: false });

    if (workoutsError) {
      console.error("Error fetching workouts:", workoutsError);
      return;
    }

    // Fetch exercises for each workout
    const workoutsWithExercises = await Promise.all(
      (workoutsData || []).map(async (workout) => {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .eq("workout_id", workout.id)
          .order("created_at", { ascending: true });

        if (exercisesError) {
          console.error("Error fetching exercises:", exercisesError);
          return { ...workout, exercises: [] };
        }

        return { ...workout, exercises: exercisesData || [] };
      })
    );

    setWorkouts(workoutsWithExercises);
  }

  function formatTime(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  }

  async function handleCreateWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (!workoutTitle.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("workouts")
      .insert([
        {
          title: workoutTitle,
          date: format(date, "yyyy-MM-dd"),
          user_id: userData.user?.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating workout:", error);
      return;
    }

    setWorkoutTitle("");
    setSelectedWorkout(data.id);
    fetchWorkouts();
  }

  async function handleStrengthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !selectedWorkout ||
      !exerciseForm.name ||
      !exerciseForm.reps ||
      !exerciseForm.weight
    ) {
      console.error("Missing required fields:", {
        selectedWorkout,
        name: exerciseForm.name,
        reps: exerciseForm.reps,
        weight: exerciseForm.weight,
      });
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      return;
    }

    if (!userData.user?.id) {
      console.error("No user ID found");
      return;
    }

    const exerciseData = {
      workout_id: selectedWorkout,
      type: "strength",
      name: exerciseForm.name,
      reps: parseInt(exerciseForm.reps),
      weight: parseFloat(exerciseForm.weight),
      user_id: userData.user.id,
    };

    console.log("Submitting exercise data:", exerciseData);

    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert([exerciseData])
        .select();

      if (error) {
        console.error("Error saving exercise:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return;
      }

      console.log("Exercise saved successfully:", data);

      setExerciseForm({ name: "", reps: "", weight: "" });
      setSelectedType(null);
      fetchWorkouts();
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  async function handleCardioSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkout || !exerciseForm.name) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      return;
    }

    if (!userData.user?.id) {
      console.error("No user ID found");
      return;
    }

    const exerciseData = {
      workout_id: selectedWorkout,
      type: "cardio",
      name: exerciseForm.name,
      duration: time || null,
      user_id: userData.user.id,
    };

    console.log("Submitting exercise data:", exerciseData);

    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert([exerciseData])
        .select();

      if (error) {
        console.error("Error saving exercise:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return;
      }

      console.log("Exercise saved successfully:", data);

      setExerciseForm({ name: "", reps: "", weight: "" });
      setTime(0);
      setIsRunning(false);
      setSelectedType(null);
      fetchWorkouts();
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  async function handleEditExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExercise || !exerciseForm.name) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.id) {
      console.error("Error getting user:", userError);
      return;
    }

    const exerciseData = {
      name: exerciseForm.name,
      ...(editingExercise.type === "strength" && {
        reps: parseInt(exerciseForm.reps),
        weight: parseFloat(exerciseForm.weight),
      }),
      ...(editingExercise.type === "cardio" && {
        duration: time || null,
      }),
    };

    try {
      const { error } = await supabase
        .from("exercises")
        .update(exerciseData)
        .eq("id", editingExercise.id);

      if (error) {
        console.error("Error updating exercise:", error);
        return;
      }

      setEditingExercise(null);
      setExerciseForm({ name: "", reps: "", weight: "" });
      setTime(0);
      setIsRunning(false);
      fetchWorkouts();
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    try {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) {
        console.error("Error deleting exercise:", error);
        return;
      }

      fetchWorkouts();
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  function startEditingExercise(exercise: Exercise) {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      reps: exercise.reps?.toString() || "",
      weight: exercise.weight?.toString() || "",
    });
    if (exercise.type === "cardio" && exercise.duration) {
      setTime(exercise.duration);
    }
  }

  // Group workouts by date
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const date = workout.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Workouts</h1>

        <div className="grid gap-8">
          {/* Create Workout Card */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Workout</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWorkout} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Workout Title</Label>
                  <Input
                    id="title"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    placeholder="Enter workout title..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date: Date | undefined) =>
                          date && setDate(date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button type="submit">Create Workout</Button>
              </form>
            </CardContent>
          </Card>

          {/* Workout History */}
          <div className="grid gap-8">
            {Object.entries(groupedWorkouts)
              .sort(
                (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
              )
              .map(([date, dateWorkouts]) => (
                <div key={date} className="grid gap-4">
                  <h2 className="text-xl font-semibold">
                    {format(new Date(date), "PPP")}
                  </h2>
                  {dateWorkouts.map((workout) => (
                    <Card key={workout.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>{workout.title}</CardTitle>
                          </div>
                          {selectedWorkout !== workout.id ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedWorkout(workout.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Exercise
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedWorkout(null)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Exercise List */}
                        <div className="grid gap-4">
                          {workout.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex justify-between items-center p-2 border rounded"
                            >
                              <div>
                                <p className="font-medium">{exercise.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.type}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  {exercise.type === "cardio" ? (
                                    <p>{formatTime(exercise.duration || 0)}</p>
                                  ) : (
                                    <p>
                                      {exercise.reps} reps @ {exercise.weight}{" "}
                                      lbs
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingExercise(exercise)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteExercise(exercise.id)
                                  }
                                  className="text-destructive"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add/Edit Exercise Form */}
                        {(selectedWorkout === workout.id ||
                          editingExercise) && (
                          <div className="mt-4">
                            {!selectedType && !editingExercise ? (
                              <div className="flex gap-4">
                                <Button
                                  onClick={() => setSelectedType("strength")}
                                  className="flex-1"
                                >
                                  Add Strength Exercise
                                </Button>
                                <Button
                                  onClick={() => setSelectedType("cardio")}
                                  className="flex-1"
                                >
                                  Add Cardio Exercise
                                </Button>
                              </div>
                            ) : (
                              <form
                                onSubmit={
                                  editingExercise
                                    ? handleEditExercise
                                    : selectedType === "strength"
                                    ? handleStrengthSubmit
                                    : handleCardioSubmit
                                }
                                className="grid gap-4"
                              >
                                <div className="grid gap-2">
                                  <Label htmlFor="name">Exercise Name</Label>
                                  <Input
                                    id="name"
                                    value={exerciseForm.name}
                                    onChange={(e) =>
                                      setExerciseForm({
                                        ...exerciseForm,
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="Enter exercise name..."
                                  />
                                </div>

                                {selectedType === "strength" ||
                                editingExercise?.type === "strength" ? (
                                  <>
                                    <div className="grid gap-2">
                                      <Label htmlFor="reps">Reps</Label>
                                      <Input
                                        id="reps"
                                        type="number"
                                        value={exerciseForm.reps}
                                        onChange={(e) =>
                                          setExerciseForm({
                                            ...exerciseForm,
                                            reps: e.target.value,
                                          })
                                        }
                                        placeholder="Enter number of reps..."
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="weight">
                                        Weight (lbs)
                                      </Label>
                                      <Input
                                        id="weight"
                                        type="number"
                                        step="0.01"
                                        value={exerciseForm.weight}
                                        onChange={(e) =>
                                          setExerciseForm({
                                            ...exerciseForm,
                                            weight: e.target.value,
                                          })
                                        }
                                        placeholder="Enter weight in pounds..."
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <div className="grid gap-4">
                                    <div className="text-4xl font-mono text-center">
                                      {formatTime(time)}
                                    </div>
                                    <div className="flex gap-4 justify-center">
                                      <Button
                                        type="button"
                                        onClick={() => setIsRunning(!isRunning)}
                                        variant={
                                          isRunning ? "destructive" : "default"
                                        }
                                      >
                                        {isRunning ? "Stop" : "Start"}
                                      </Button>
                                      <div className="flex gap-2">
                                        <Input
                                          type="number"
                                          value={Math.floor(time / 60000)}
                                          onChange={(e) => {
                                            const minutes =
                                              parseInt(e.target.value) || 0;
                                            setTime(minutes * 60000);
                                          }}
                                          className="w-20"
                                          placeholder="Min"
                                        />
                                        <Input
                                          type="number"
                                          value={Math.floor(
                                            (time % 60000) / 1000
                                          )}
                                          onChange={(e) => {
                                            const seconds =
                                              parseInt(e.target.value) || 0;
                                            setTime(
                                              Math.floor(time / 60000) * 60000 +
                                                seconds * 1000
                                            );
                                          }}
                                          className="w-20"
                                          placeholder="Sec"
                                        />
                                      </div>
                                      <Button
                                        type="submit"
                                        disabled={!exerciseForm.name}
                                      >
                                        {editingExercise ? "Update" : "Save"}
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  {(selectedType === "strength" ||
                                    editingExercise?.type === "strength") && (
                                    <Button type="submit">
                                      {editingExercise ? "Update" : "Save"}
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedType(null);
                                      setEditingExercise(null);
                                      setExerciseForm({
                                        name: "",
                                        reps: "",
                                        weight: "",
                                      });
                                      setTime(0);
                                      setIsRunning(false);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
