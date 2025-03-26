"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LoadingCard } from "@/components/ui/loading-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RidingChecklist {
  id: string;
  date: string;
  chain_tension: boolean;
  chain_lube: boolean;
  tire_type: boolean;
  tire_pressure: boolean;
  riding_gear: boolean;
  tools: boolean;
  food: boolean;
  water: boolean;
  fluids: boolean;
  fork_pressure: boolean;
  axle_nuts: boolean;
  linkage_nuts: boolean;
  sprocket_bolts: boolean;
  created_at: string;
}

interface MotoChecklist {
  id: string;
  riding_checklist_id: string;
  moto_number: number;
  fluids: boolean;
  fork_pressure: boolean;
  chain_lube: boolean;
  chain_tension: boolean;
  axle_nuts: boolean;
  linkage_nuts: boolean;
  sprocket_bolts: boolean;
  created_at: string;
}

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<
    (RidingChecklist & { motos: MotoChecklist[] })[]
  >([]);
  const [date, setDate] = useState<Date>(new Date());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch riding checklists
      const { data: checklistsData, error: checklistsError } = await supabase
        .from("riding_checklists")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("date", { ascending: false });

      if (checklistsError) {
        console.error("Error fetching checklists:", checklistsError);
        return;
      }

      // Fetch moto checklists for each riding checklist
      const { data: motosData, error: motosError } = await supabase
        .from("moto_checklists")
        .select("*")
        .in(
          "riding_checklist_id",
          checklistsData.map((c) => c.id)
        );

      if (motosError) {
        console.error("Error fetching motos:", motosError);
        return;
      }

      // Combine the data
      const combinedData = checklistsData.map((checklist) => ({
        ...checklist,
        motos: motosData.filter(
          (moto) => moto.riding_checklist_id === checklist.id
        ),
      }));

      setChecklists(combinedData);

      // Set the most recent checklist to be expanded
      if (combinedData.length > 0) {
        setExpandedCards(new Set([combinedData[0].id]));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChecklist = async () => {
    try {
      setIsCreating(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      if (!date) {
        toast({
          title: "Select a date",
          description: "Please select a date before creating a new checklist.",
          variant: "destructive",
        });
        return;
      }

      // Format the selected date as YYYY-MM-DD
      const dateStr = format(date, "yyyy-MM-dd");

      // Check if a checklist already exists for this date
      const { data: existingChecklist } = await supabase
        .from("riding_checklists")
        .select("id")
        .eq("user_id", userData.user.id)
        .eq("date", dateStr)
        .single();

      if (existingChecklist) {
        toast({
          title: "Checklist already exists",
          description: `A checklist for ${format(date, "PPP")} already exists.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("riding_checklists").insert([
        {
          user_id: userData.user.id,
          date: dateStr,
        },
      ]);

      if (error) {
        console.error("Error creating checklist:", error);
        toast({
          title: "Error",
          description: "Failed to create checklist. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Created new checklist for ${format(date, "PPP")}.`,
      });
      setDate(new Date());
      await fetchChecklists();
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateChecklist = async (
    checklistId: string,
    field: keyof RidingChecklist,
    value: any
  ) => {
    const { error } = await supabase
      .from("riding_checklists")
      .update({ [field]: value })
      .eq("id", checklistId);

    if (error) {
      console.error("Error updating checklist:", error);
      return;
    }

    fetchChecklists();
  };

  const handleAddMoto = async (checklistId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const checklist = checklists.find((c) => c.id === checklistId);
    if (!checklist) return;

    const nextMotoNumber = checklist.motos.length + 1;

    const { error } = await supabase.from("moto_checklists").insert([
      {
        user_id: userData.user.id,
        riding_checklist_id: checklistId,
        moto_number: nextMotoNumber,
      },
    ]);

    if (error) {
      console.error("Error adding moto:", error);
      return;
    }

    fetchChecklists();
  };

  const handleUpdateMoto = async (
    motoId: string,
    field: keyof MotoChecklist,
    value: any
  ) => {
    const { error } = await supabase
      .from("moto_checklists")
      .update({ [field]: value })
      .eq("id", motoId);

    if (error) {
      console.error("Error updating moto:", error);
      return;
    }

    fetchChecklists();
  };

  const handleDeleteMoto = async (motoId: string) => {
    const { error } = await supabase
      .from("moto_checklists")
      .delete()
      .eq("id", motoId);

    if (error) {
      console.error("Error deleting moto:", error);
      return;
    }

    fetchChecklists();
  };

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <MainLayout>
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Riding Checklist</h1>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleCreateChecklist} disabled={isCreating}>
              {isCreating ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              New Checklist
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <>
              <LoadingCard title="Today's Checklist" />
              <LoadingCard title="Previous Checklist" />
            </>
          ) : checklists.length > 0 ? (
            checklists.map((checklist) => (
              <Card key={checklist.id}>
                <Collapsible open={expandedCards.has(checklist.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader
                      className="cursor-pointer hover:bg-accent hover:bg-opacity-50"
                      onClick={() => toggleCard(checklist.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {format(
                            new Date(checklist.date + "T00:00:00"),
                            "PPP"
                          )}
                        </CardTitle>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4",
                            expandedCards.has(checklist.id)
                              ? "transform rotate-180"
                              : ""
                          )}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">
                            Pre-Ride Checklist
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries({
                              chain_tension: "Chain Tension",
                              chain_lube: "Chain Lube",
                              tire_type: "Tire Type",
                              tire_pressure: "Tire Pressure",
                              riding_gear: "Riding Gear",
                              tools: "Tools",
                              food: "Food",
                              water: "Water",
                              fluids: "Fluids",
                              fork_pressure: "Fork Pressure",
                              axle_nuts: "Axle Nuts",
                              linkage_nuts: "Linkage Nuts",
                              sprocket_bolts: "Sprocket Bolts",
                            }).map(([key, label]) => (
                              <div key={key}>
                                <div className="flex items-center space-x-3 py-2 hover:bg-accent/50 rounded-md">
                                  <Checkbox
                                    id={`${key}-${checklist.id}`}
                                    checked={
                                      checklist[
                                        key as keyof RidingChecklist
                                      ] as boolean
                                    }
                                    className="h-5 w-5"
                                    onCheckedChange={(checked: boolean) =>
                                      handleUpdateChecklist(
                                        checklist.id,
                                        key as keyof RidingChecklist,
                                        checked
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`${key}-${checklist.id}`}
                                    className="text-base"
                                  >
                                    {label}
                                  </Label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Motos</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddMoto(checklist.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Moto
                            </Button>
                          </div>
                          <div className="grid gap-4">
                            {checklist.motos.map((moto) => (
                              <Card key={moto.id}>
                                <CardContent className="pt-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-base font-semibold">
                                      Moto{" "}
                                      {checklist.motos.length -
                                        moto.moto_number +
                                        1}
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteMoto(moto.id)}
                                      className="text-destructive hover:text-destructive/90 -mt-2 -mr-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries({
                                      fluids: "Fluids",
                                      chain_tension: "Chain Tension",
                                      tire_pressure: "Tire Pressure",
                                      axle_nuts: "Axle Nuts",
                                      sprocket_bolts: "Sprocket Bolts",
                                    }).map(([key, label]) => (
                                      <div key={key}>
                                        <div className="flex items-center space-x-3 py-2 hover:bg-accent/50 rounded-md">
                                          <Checkbox
                                            id={`moto-${key}-${moto.id}`}
                                            checked={
                                              moto[
                                                key as keyof MotoChecklist
                                              ] as boolean
                                            }
                                            className="h-5 w-5"
                                            onCheckedChange={(
                                              checked: boolean
                                            ) =>
                                              handleUpdateMoto(
                                                moto.id,
                                                key as keyof MotoChecklist,
                                                checked
                                              )
                                            }
                                          />
                                          <Label
                                            htmlFor={`moto-${key}-${moto.id}`}
                                            className="text-base"
                                          >
                                            {label}
                                          </Label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No checklists yet. Create your first checklist using the button
              above.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
