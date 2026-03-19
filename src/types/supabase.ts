export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      calendar: {
        Row: {
          created_at: string
          end_time: string | null
          id: number
          start_time: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: number
          start_time?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: number
          start_time?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chore_history: {
        Row: {
          chore_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          chore_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          chore_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_history_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          created_at: string
          description: string | null
          frequency: string
          id: string
          is_recurring: boolean | null
          last_completed: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_recurring?: boolean | null
          last_completed?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_recurring?: boolean | null
          last_completed?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      food: {
        Row: {
          calories: number | null
          content: string | null
          created_at: string | null
          id: string
          is_home_cooked: boolean | null
          meal: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_home_cooked?: boolean | null
          meal?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_home_cooked?: boolean | null
          meal?: string | null
          user_id?: string
        }
        Relationships: []
      }
      food_inventory: {
        Row: {
          category: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          item_name: string
          quantity: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          item_name: string
          quantity?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          item_name?: string
          quantity?: string | null
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      food_top_list_items: {
        Row: {
          created_at: string
          dish_name: string | null
          id: string
          lat: number | null
          list_id: string
          lng: number | null
          location_name: string | null
          must_try_other_dishes: string | null
          photo_url: string | null
          price_point: number | null
          rating_flavor: number | null
          rating_value: number | null
          rating_vibe: number | null
          restaurant_name: string
          review_notes: string | null
          user_id: string
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          dish_name?: string | null
          id?: string
          lat?: number | null
          list_id: string
          lng?: number | null
          location_name?: string | null
          must_try_other_dishes?: string | null
          photo_url?: string | null
          price_point?: number | null
          rating_flavor?: number | null
          rating_value?: number | null
          rating_vibe?: number | null
          restaurant_name: string
          review_notes?: string | null
          user_id: string
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          dish_name?: string | null
          id?: string
          lat?: number | null
          list_id?: string
          lng?: number | null
          location_name?: string | null
          must_try_other_dishes?: string | null
          photo_url?: string | null
          price_point?: number | null
          rating_flavor?: number | null
          rating_value?: number | null
          rating_vibe?: number | null
          restaurant_name?: string
          review_notes?: string | null
          user_id?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_top_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "food_top_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      food_top_lists: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          label_ids: string[] | null
          status: string | null
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label_ids?: string[] | null
          status?: string | null
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label_ids?: string[] | null
          status?: string | null
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      health: {
        Row: {
          created_at: string
          id: number
          metric: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          metric?: string | null
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          metric?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      health_appointments: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          provider: string
          time: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          provider: string
          time?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          provider?: string
          time?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ingredients_library: {
        Row: {
          created_at: string | null
          id: string
          last_unit: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_unit?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_unit?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plan: {
        Row: {
          created_at: string | null
          day_date: string
          id: string
          meal_type: string | null
          note: string | null
          recipe_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_date: string
          id?: string
          meal_type?: string | null
          note?: string | null
          recipe_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_date?: string
          id?: string
          meal_type?: string | null
          note?: string | null
          recipe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      money: {
        Row: {
          amount: number | null
          created_at: string
          id: number
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: number
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: number
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      money_accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          due_day: number | null
          fixed_amount: number | null
          id: string
          last_statement_amount: number | null
          name: string
          payoff_mode: string | null
          payoff_weeks: number | null
          position: number | null
          statement_balance: number | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          due_day?: number | null
          fixed_amount?: number | null
          id?: string
          last_statement_amount?: number | null
          name: string
          payoff_mode?: string | null
          payoff_weeks?: number | null
          position?: number | null
          statement_balance?: number | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          due_day?: number | null
          fixed_amount?: number | null
          id?: string
          last_statement_amount?: number | null
          name?: string
          payoff_mode?: string | null
          payoff_weeks?: number | null
          position?: number | null
          statement_balance?: number | null
          user_id?: string
        }
        Relationships: []
      }
      money_bills: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          is_paid: boolean | null
          name: string
          position: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          is_paid?: boolean | null
          name: string
          position?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          is_paid?: boolean | null
          name?: string
          position?: number | null
          user_id?: string
        }
        Relationships: []
      }
      money_items: {
        Row: {
          account_id: string | null
          amount: number | null
          created_at: string | null
          id: string
          is_paid: boolean | null
          position: number | null
          title: string
          user_id: string
          week_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          position?: number | null
          title: string
          user_id: string
          week_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          position?: number | null
          title?: string
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "money_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_items_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "money_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      money_weeks: {
        Row: {
          created_at: string | null
          id: string
          position: number | null
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number | null
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          dashboard_widgets: Json | null
          feature_hierarchy: Json | null
          gemini_api_key: string | null
          id: string
          page_names: Json | null
          portal_config: Json | null
          style: string | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          dashboard_widgets?: Json | null
          feature_hierarchy?: Json | null
          gemini_api_key?: string | null
          id: string
          page_names?: Json | null
          portal_config?: Json | null
          style?: string | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          dashboard_widgets?: Json | null
          feature_hierarchy?: Json | null
          gemini_api_key?: string | null
          id?: string
          page_names?: Json | null
          portal_config?: Json | null
          style?: string | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reading_list: {
        Row: {
          author: string | null
          created_at: string | null
          id: string
          notes: string | null
          rating: number | null
          status: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          status?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          status?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string | null
          id: string
          ingredients: Json | null
          instructions: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      recreation_camping: {
        Row: {
          amenities: string[] | null
          created_at: string
          end_date: string | null
          id: string
          is_favorite: boolean | null
          location: string | null
          notes: string | null
          site_name: string
          start_date: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_favorite?: boolean | null
          location?: string | null
          notes?: string | null
          site_name: string
          start_date?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amenities?: string[] | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_favorite?: boolean | null
          location?: string | null
          notes?: string | null
          site_name?: string
          start_date?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recreation_hikes: {
        Row: {
          created_at: string
          date: string
          difficulty: string | null
          distance: number | null
          elevation_gain: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          difficulty?: string | null
          distance?: number | null
          elevation_gain?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          difficulty?: string | null
          distance?: number | null
          elevation_gain?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      todo_labels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_complete: boolean | null
          label_ids: string[] | null
          position: number | null
          status: string | null
          task: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_complete?: boolean | null
          label_ids?: string[] | null
          position?: number | null
          status?: string | null
          task?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_complete?: boolean | null
          label_ids?: string[] | null
          position?: number | null
          status?: string | null
          task?: string | null
          user_id?: string
        }
        Relationships: []
      }
      travel_bucket_list: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_visited: boolean | null
          name: string
          notes: string | null
          priority: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_visited?: boolean | null
          name: string
          notes?: string | null
          priority?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_visited?: boolean | null
          name?: string
          notes?: string | null
          priority?: string | null
          user_id?: string
        }
        Relationships: []
      }
      travel_days: {
        Row: {
          created_at: string
          date: string | null
          day_number: number
          destination_city: string | null
          id: string
          notes: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          day_number: number
          destination_city?: string | null
          id?: string
          notes?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          day_number?: number
          destination_city?: string | null
          id?: string
          notes?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "travel_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_packing: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_packed: boolean | null
          item_name: string
          trip_id: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_packed?: boolean | null
          item_name: string
          trip_id?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_packed?: boolean | null
          item_name?: string
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_packing_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "travel_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_poi: {
        Row: {
          bucket_id: string | null
          category: string | null
          created_at: string
          day_id: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          user_id: string
        }
        Insert: {
          bucket_id?: string | null
          category?: string | null
          created_at?: string
          day_id?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          user_id: string
        }
        Update: {
          bucket_id?: string | null
          category?: string | null
          created_at?: string
          day_id?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_poi_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "travel_bucket_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_poi_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "travel_days"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_trips: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vault: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicle_records: {
        Row: {
          cost: number | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          odometer: number | null
          type: string | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          odometer?: number | null
          type?: string | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          odometer?: number | null
          type?: string | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          image_url: string | null
          make: string | null
          model: string | null
          name: string
          style: string | null
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          make?: string | null
          model?: string | null
          name: string
          style?: string | null
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          make?: string | null
          model?: string | null
          name?: string
          style?: string | null
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      weather_locations: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          latitude: number
          longitude: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude: number
          longitude: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
