export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tracks: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      lap_sessions: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          date: string;
          total_time: number;
          laps: Json[];
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          user_id: string;
          date: string;
          total_time: number;
          laps: Json[];
          created_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          user_id?: string;
          date?: string;
          total_time?: number;
          laps?: Json[];
          created_at?: string;
        };
      };
      riding_checklists: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          chain_tension: boolean;
          chain_lube: boolean;
          tire_pressure: boolean;
          riding_gear: boolean;
          tools: boolean;
          food: boolean;
          water: boolean;
          fluids: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          chain_tension?: boolean;
          chain_lube?: boolean;
          tire_pressure?: boolean;
          riding_gear?: boolean;
          tools?: boolean;
          food?: boolean;
          water?: boolean;
          fluids?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          chain_tension?: boolean;
          chain_lube?: boolean;
          tire_pressure?: boolean;
          riding_gear?: boolean;
          tools?: boolean;
          food?: boolean;
          water?: boolean;
          fluids?: boolean;
          created_at?: string;
        };
      };
      moto_checklists: {
        Row: {
          id: string;
          checklist_id: string;
          moto_number: number;
          fork_pressure: boolean;
          axle_nuts: boolean;
          linkage_nuts: boolean;
          sprocket_bolts: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          checklist_id: string;
          moto_number: number;
          fork_pressure?: boolean;
          axle_nuts?: boolean;
          linkage_nuts?: boolean;
          sprocket_bolts?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          checklist_id?: string;
          moto_number?: number;
          fork_pressure?: boolean;
          axle_nuts?: boolean;
          linkage_nuts?: boolean;
          sprocket_bolts?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
