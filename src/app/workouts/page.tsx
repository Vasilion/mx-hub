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
import {
  CalendarIcon,
  Plus,
  Trash2,
  Square,
  Play,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingCard } from "@/components/ui/loading-card";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Exercise {
  id: string;
  name: string;
  type: "cardio" | "strength";
  reps: number | null;
  weight: number | null;
  duration: number | null;
  sets: number | null;
  workout_id: string;
  user_id: string;
  created_at: string;
}

interface Workout {
  id: string;
  title: string;
  date: string;
  user_id: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    reps: "",
    weight: "",
    sets: "",
  });
  const { toast } = useToast();

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
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userData.user.id)
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
    } finally {
      setIsLoading(false);
    }
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

    try {
      setIsCreating(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("workouts")
        .insert([
          {
            title: workoutTitle.trim(),
            date: format(date, "yyyy-MM-dd"),
            user_id: userData.user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating workout:", error);
        return;
      }

      // Update UI state directly
      setWorkouts((prev) => [{ ...data, exercises: [] }, ...prev]);
      setWorkoutTitle("");
    } finally {
      setIsCreating(false);
    }
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
      sets: parseInt(exerciseForm.sets),
      user_id: userData.user.id,
    };

    console.log("Submitting exercise data:", exerciseData);

    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert([exerciseData])
        .select()
        .single();

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

      setExerciseForm({ name: "", reps: "", weight: "", sets: "" });
      setSelectedType(null);
      setWorkouts((prev) =>
        prev.map((workout) =>
          workout.id === selectedWorkout
            ? { ...workout, exercises: [...workout.exercises, data] }
            : workout
        )
      );
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
      type: "cardio" as const,
      name: exerciseForm.name,
      duration: time || undefined,
      user_id: userData.user.id,
    };

    console.log("Submitting exercise data:", exerciseData);

    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert([exerciseData])
        .select()
        .single();

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

      setExerciseForm({ name: "", reps: "", weight: "", sets: "" });
      setTime(0);
      setIsRunning(false);
      setSelectedType(null);
      setWorkouts((prev) =>
        prev.map((workout) =>
          workout.id === selectedWorkout
            ? { ...workout, exercises: [...workout.exercises, data] }
            : workout
        )
      );
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
        sets: parseInt(exerciseForm.sets),
        duration: undefined,
      }),
      ...(editingExercise.type === "cardio" && {
        duration: time || undefined,
        reps: undefined,
        weight: undefined,
        sets: undefined,
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

      const updatedExercise: Exercise = {
        ...editingExercise,
        ...exerciseData,
      };

      setEditingExercise(null);
      setExerciseForm({ name: "", reps: "", weight: "", sets: "" });
      setTime(0);
      setIsRunning(false);
      setWorkouts((prev) =>
        prev.map((workout) => ({
          ...workout,
          exercises: workout.exercises.map((exercise) =>
            exercise.id === editingExercise.id ? updatedExercise : exercise
          ),
        }))
      );
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
        toast({
          title: "Error",
          description: "Failed to delete exercise. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setWorkouts((prev) =>
        prev.map((workout) => ({
          ...workout,
          exercises: workout.exercises.filter(
            (exercise) => exercise.id !== exerciseId
          ),
        }))
      );
      toast({
        title: "Success",
        description: "Exercise deleted successfully.",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  function startEditingExercise(exercise: Exercise) {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      reps: exercise.reps?.toString() || "",
      weight: exercise.weight?.toString() || "",
      sets: exercise.sets?.toString() || "",
    });
    if (exercise.type === "cardio" && exercise.duration) {
      setTime(exercise.duration);
    }

    // Add smooth scrolling after a short delay to ensure the form is rendered
    setTimeout(() => {
      const editForm = document.getElementById(`edit-${exercise.id}`);
      if (editForm) {
        editForm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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

  async function handleSaveExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkout && !editingExercise) return;

    try {
      setIsSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      if (editingExercise) {
        // Update existing exercise
        const exerciseData = {
          name: exerciseForm.name,
          ...(editingExercise.type === "strength" && {
            reps: parseInt(exerciseForm.reps),
            weight: parseFloat(exerciseForm.weight),
            sets: parseInt(exerciseForm.sets),
            duration: null,
          }),
          ...(editingExercise.type === "cardio" && {
            duration: time,
            reps: null,
            weight: null,
            sets: null,
          }),
        };

        const { error } = await supabase
          .from("exercises")
          .update(exerciseData)
          .eq("id", editingExercise.id)
          .eq("user_id", userData.user.id);

        if (error) {
          console.error("Error updating exercise:", error);
          toast({
            title: "Error",
            description: "Failed to update exercise. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Update UI state
        setWorkouts((prev) =>
          prev.map((workout) => ({
            ...workout,
            exercises: workout.exercises.map((ex) =>
              ex.id === editingExercise.id ? { ...ex, ...exerciseData } : ex
            ),
          }))
        );
      } else {
        // Create new exercise
        const exerciseData = {
          name: exerciseForm.name,
          type: selectedType,
          reps:
            selectedType === "strength" ? parseInt(exerciseForm.reps) : null,
          weight:
            selectedType === "strength"
              ? parseFloat(exerciseForm.weight)
              : null,
          sets:
            selectedType === "strength" ? parseInt(exerciseForm.sets) : null,
          duration: selectedType === "cardio" ? time : null,
          workout_id: selectedWorkout,
          user_id: userData.user.id,
        };

        const { data, error } = await supabase
          .from("exercises")
          .insert([exerciseData])
          .select()
          .single();

        if (error) {
          console.error("Error creating exercise:", error);
          toast({
            title: "Error",
            description: "Failed to create exercise. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Update UI state
        setWorkouts((prev) =>
          prev.map((workout) =>
            workout.id === selectedWorkout
              ? {
                  ...workout,
                  exercises: [...workout.exercises, data],
                }
              : workout
          )
        );

        toast({
          title: "Success",
          description: "Exercise added successfully.",
        });
      }

      // Reset form
      setSelectedType(null);
      setExerciseForm({ name: "", reps: "", weight: "", sets: "" });
      setTime(0);
      setIsRunning(false);
      setEditingExercise(null);
      setSelectedWorkout(null);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteWorkout(workoutId: string) {
    try {
      // First delete all exercises in the workout
      const { error: exercisesError } = await supabase
        .from("exercises")
        .delete()
        .eq("workout_id", workoutId);

      if (exercisesError) {
        console.error("Error deleting exercises:", exercisesError);
        toast({
          title: "Error",
          description: "Failed to delete workout exercises. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Then delete the workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);

      if (workoutError) {
        console.error("Error deleting workout:", workoutError);
        toast({
          title: "Error",
          description: "Failed to delete workout. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update UI state
      setWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId));
      toast({
        title: "Success",
        description: "Workout deleted successfully.",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Workouts</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWorkout} className="flex gap-4">
              <Input
                placeholder="Enter workout title"
                value={workoutTitle}
                onChange={(e) => setWorkoutTitle(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Workout
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Workout History */}
        <div className="grid gap-8">
          {isLoading ? (
            <>
              <LoadingCard title="Today's Workout" />
              <LoadingCard title="Previous Workout" />
            </>
          ) : (
            Object.entries(groupedWorkouts)
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
                          <CardTitle>{workout.title}</CardTitle>
                          <div className="flex items-center gap-2">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                              onClick={() => handleDeleteWorkout(workout.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Exercise List */}
                        <div className="grid gap-4 max-w-full overflow-x-hidden">
                          {workout.exercises.map((exercise) => (
                            <div key={exercise.id}>
                              <div className="flex flex-wrap justify-between items-center p-2 border rounded">
                                <div className="min-w-[120px]">
                                  <p className="font-medium">{exercise.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.type}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                  <div className="text-right min-w-[80px]">
                                    {exercise.type === "cardio" ? (
                                      <p>
                                        {formatTime(exercise.duration || 0)}
                                      </p>
                                    ) : (
                                      <p>
                                        {exercise.sets} sets × {exercise.reps}{" "}
                                        reps @ {exercise.weight} lbs
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1 sm:gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedWorkout(null);
                                        startEditingExercise(exercise);
                                      }}
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
                              </div>

                              {/* Edit Form - Appears directly under the exercise */}
                              {editingExercise?.id === exercise.id && (
                                <div
                                  className="mt-2 p-4 border rounded bg-accent/10 overflow-x-auto"
                                  id={`edit-${exercise.id}`}
                                >
                                  <form
                                    onSubmit={handleSaveExercise}
                                    className="grid gap-4"
                                  >
                                    <div className="grid gap-2">
                                      <Label htmlFor="name">
                                        Exercise Name
                                      </Label>
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

                                    {editingExercise.type === "strength" ? (
                                      <>
                                        <div className="grid gap-2">
                                          <Label htmlFor="sets">Sets</Label>
                                          <Input
                                            id="sets"
                                            type="number"
                                            value={exerciseForm.sets}
                                            onChange={(e) =>
                                              setExerciseForm({
                                                ...exerciseForm,
                                                sets: e.target.value,
                                              })
                                            }
                                            placeholder="Enter number of sets..."
                                          />
                                        </div>
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
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            type="submit"
                                            disabled={isSaving}
                                          >
                                            {isSaving ? (
                                              <LoadingSpinner className="w-4 h-4 mr-2" />
                                            ) : null}
                                            Update
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                              setEditingExercise(null);
                                              setExerciseForm({
                                                name: "",
                                                reps: "",
                                                weight: "",
                                                sets: "",
                                              });
                                            }}
                                            disabled={isSaving}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="grid gap-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                          <div className="flex-1 min-w-[200px]">
                                            <Label>Duration</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                              <div className="text-2xl font-mono">
                                                {formatTime(time)}
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  onClick={() =>
                                                    setIsRunning(!isRunning)
                                                  }
                                                  className={
                                                    isRunning
                                                      ? "text-destructive"
                                                      : ""
                                                  }
                                                >
                                                  {isRunning ? (
                                                    <Square className="h-4 w-4" />
                                                  ) : (
                                                    <Play className="h-4 w-4" />
                                                  )}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  onClick={() => {
                                                    setTime(0);
                                                    setIsRunning(false);
                                                  }}
                                                >
                                                  <RotateCcw className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex gap-2 mt-4 sm:mt-0">
                                            <Button
                                              type="submit"
                                              disabled={isSaving}
                                            >
                                              {isSaving ? (
                                                <LoadingSpinner className="w-4 h-4 mr-2" />
                                              ) : null}
                                              Update
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => {
                                                setEditingExercise(null);
                                                setExerciseForm({
                                                  name: "",
                                                  reps: "",
                                                  weight: "",
                                                  sets: "",
                                                });
                                                setTime(0);
                                                setIsRunning(false);
                                              }}
                                              disabled={isSaving}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </form>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add Exercise Form - Only show when adding new exercise */}
                        {selectedWorkout === workout.id && !editingExercise && (
                          <div className="mt-4 overflow-x-auto">
                            {!selectedType ? (
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
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
                                onSubmit={handleSaveExercise}
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

                                {selectedType === "strength" ? (
                                  <>
                                    <div className="grid gap-2">
                                      <Label htmlFor="sets">Sets</Label>
                                      <Input
                                        id="sets"
                                        type="number"
                                        value={exerciseForm.sets}
                                        onChange={(e) =>
                                          setExerciseForm({
                                            ...exerciseForm,
                                            sets: e.target.value,
                                          })
                                        }
                                        placeholder="Enter number of sets..."
                                      />
                                    </div>
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
                                    <div className="flex justify-end gap-2">
                                      <Button type="submit" disabled={isSaving}>
                                        {isSaving ? (
                                          <LoadingSpinner className="w-4 h-4 mr-2" />
                                        ) : null}
                                        Save
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedType(null);
                                          setExerciseForm({
                                            name: "",
                                            reps: "",
                                            weight: "",
                                            sets: "",
                                          });
                                        }}
                                        disabled={isSaving}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="grid gap-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="name">
                                        Exercise Name
                                      </Label>
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
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                      <div className="flex-1 min-w-[200px]">
                                        <Label>Duration</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <div className="text-2xl font-mono">
                                            {formatTime(time)}
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              onClick={() =>
                                                setIsRunning(!isRunning)
                                              }
                                              className={
                                                isRunning
                                                  ? "text-destructive"
                                                  : ""
                                              }
                                            >
                                              {isRunning ? (
                                                <Square className="h-4 w-4" />
                                              ) : (
                                                <Play className="h-4 w-4" />
                                              )}
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              onClick={() => {
                                                setTime(0);
                                                setIsRunning(false);
                                              }}
                                            >
                                              <RotateCcw className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 mt-4 sm:mt-0">
                                        <Button
                                          type="submit"
                                          disabled={isSaving}
                                        >
                                          {isSaving ? (
                                            <LoadingSpinner className="w-4 h-4 mr-2" />
                                          ) : null}
                                          Save
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedType(null);
                                            setExerciseForm({
                                              name: "",
                                              reps: "",
                                              weight: "",
                                              sets: "",
                                            });
                                            setTime(0);
                                            setIsRunning(false);
                                          }}
                                          disabled={isSaving}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </form>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
