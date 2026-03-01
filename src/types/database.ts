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
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string;
          role: "admin" | "client";
          loyalty_points: number;
          total_completed: number;
          game_coins: number;
          current_streak: number;
          longest_streak: number;
          last_checkin_date: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          email: string;
          role?: "admin" | "client";
          loyalty_points?: number;
          total_completed?: number;
          game_coins?: number;
          current_streak?: number;
          longest_streak?: number;
          last_checkin_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          email?: string;
          role?: "admin" | "client";
          loyalty_points?: number;
          total_completed?: number;
          game_coins?: number;
          current_streak?: number;
          longest_streak?: number;
          last_checkin_date?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          duration_minutes?: number;
          price: number;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      working_hours: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
        };
      };
      blocked_slots: {
        Row: {
          id: string;
          block_date: string;
          start_time: string | null;
          end_time: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          block_date: string;
          start_time?: string | null;
          end_time?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          block_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          reason?: string | null;
          created_at?: string;
        };
      };
      appointment_services: {
        Row: {
          id: string;
          appointment_id: string;
          service_id: string;
          price_at_booking: number;
          duration_at_booking: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          service_id: string;
          price_at_booking: number;
          duration_at_booking: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          service_id?: string;
          price_at_booking?: number;
          duration_at_booking?: number;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          service_id: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
          payment_status: "none" | "pending" | "paid" | "refunded";
          payment_method: "online" | "presencial" | null;
          amount_paid: number;
          discount_applied: number;
          points_earned: number;
          total_duration: number | null;
          notes: string | null;
          google_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_id?: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
          payment_status?: "none" | "pending" | "paid" | "refunded";
          payment_method?: "online" | "presencial" | null;
          amount_paid?: number;
          discount_applied?: number;
          points_earned?: number;
          total_duration?: number | null;
          notes?: string | null;
          google_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          service_id?: string | null;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
          payment_status?: "none" | "pending" | "paid" | "refunded";
          payment_method?: "online" | "presencial" | null;
          amount_paid?: number;
          discount_applied?: number;
          points_earned?: number;
          total_duration?: number | null;
          notes?: string | null;
          google_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          appointment_id: string;
          client_id: string;
          service_id: string;
          rating: number;
          comment: string | null;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          client_id: string;
          service_id: string;
          rating: number;
          comment?: string | null;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          client_id?: string;
          service_id?: string;
          rating?: number;
          comment?: string | null;
          is_visible?: boolean;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          appointment_id: string;
          gateway: string;
          gateway_payment_id: string | null;
          amount: number;
          status: "pending" | "approved" | "refunded" | "failed";
          gateway_response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          gateway: string;
          gateway_payment_id?: string | null;
          amount: number;
          status?: "pending" | "approved" | "refunded" | "failed";
          gateway_response?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          gateway?: string;
          gateway_payment_id?: string | null;
          amount?: number;
          status?: "pending" | "approved" | "refunded" | "failed";
          gateway_response?: Json | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          appointment_id: string;
          channel: "whatsapp" | "email";
          type: "confirmation" | "reminder_24h" | "reminder_2h" | "cancellation" | "feedback_request";
          status: "pending" | "sent" | "failed" | "cancelled";
          scheduled_for: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          channel: "whatsapp" | "email";
          type: "confirmation" | "reminder_24h" | "reminder_2h" | "cancellation" | "feedback_request";
          status?: "pending" | "sent" | "failed" | "cancelled";
          scheduled_for: string;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          channel?: "whatsapp" | "email";
          type?: "confirmation" | "reminder_24h" | "reminder_2h" | "cancellation" | "feedback_request";
          status?: "pending" | "sent" | "failed" | "cancelled";
          scheduled_for?: string;
          sent_at?: string | null;
        };
      };
      loyalty_rules: {
        Row: {
          id: string;
          name: string;
          type: "earn" | "redeem";
          points_per_visit: number;
          points_threshold: number;
          discount_value: number;
          discount_percent: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: "earn" | "redeem";
          points_per_visit?: number;
          points_threshold?: number;
          discount_value?: number;
          discount_percent?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: "earn" | "redeem";
          points_per_visit?: number;
          points_threshold?: number;
          discount_value?: number;
          discount_percent?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      loyalty_history: {
        Row: {
          id: string;
          client_id: string;
          appointment_id: string | null;
          type: "earned" | "redeemed" | "expired" | "adjusted";
          points: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          appointment_id?: string | null;
          type: "earned" | "redeemed" | "expired" | "adjusted";
          points: number;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          appointment_id?: string | null;
          type?: "earned" | "redeemed" | "expired" | "adjusted";
          points?: number;
          description?: string;
          created_at?: string;
        };
      };
      portfolio: {
        Row: {
          id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          image_url: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          image_url: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          image_url?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
      game_coins_history: {
        Row: {
          id: string;
          client_id: string;
          type: "earned" | "spent" | "bonus" | "expired" | "adjusted";
          amount: number;
          source: GameCoinSource;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          type: "earned" | "spent" | "bonus" | "expired" | "adjusted";
          amount: number;
          source: GameCoinSource;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          type?: "earned" | "spent" | "bonus" | "expired" | "adjusted";
          amount?: number;
          source?: GameCoinSource;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      minigame_plays: {
        Row: {
          id: string;
          client_id: string;
          game_type: GameType;
          played_at: string;
          result: Json;
          coins_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          game_type: GameType;
          played_at?: string;
          result?: Json;
          coins_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          game_type?: GameType;
          played_at?: string;
          result?: Json;
          coins_earned?: number;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          category: "streak" | "games" | "spending" | "social";
          condition_type: string;
          condition_value: Json;
          coin_reward: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon?: string;
          category: "streak" | "games" | "spending" | "social";
          condition_type: string;
          condition_value?: Json;
          coin_reward?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          icon?: string;
          category?: "streak" | "games" | "spending" | "social";
          condition_type?: string;
          condition_value?: Json;
          coin_reward?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          client_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
      };
      reward_store_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string | null;
          type: "discount" | "service" | "product";
          coin_price: number;
          metadata: Json;
          stock: number | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          image_url?: string | null;
          type: "discount" | "service" | "product";
          coin_price: number;
          metadata?: Json;
          stock?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          image_url?: string | null;
          type?: "discount" | "service" | "product";
          coin_price?: number;
          metadata?: Json;
          stock?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      reward_redemptions: {
        Row: {
          id: string;
          client_id: string;
          item_id: string;
          coins_spent: number;
          status: "pending" | "fulfilled" | "cancelled";
          fulfilled_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          item_id: string;
          coins_spent: number;
          status?: "pending" | "fulfilled" | "cancelled";
          fulfilled_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          item_id?: string;
          coins_spent?: number;
          status?: "pending" | "fulfilled" | "cancelled";
          fulfilled_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      game_config: {
        Row: {
          id: string;
          game_type: GameType;
          config: Json;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_type: GameType;
          config?: Json;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_type?: GameType;
          config?: Json;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          question: string;
          options: Json;
          correct_index: number;
          category: string;
          difficulty: "easy" | "medium" | "hard";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          options: Json;
          correct_index: number;
          category?: string;
          difficulty?: "easy" | "medium" | "hard";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          options?: Json;
          correct_index?: number;
          category?: string;
          difficulty?: "easy" | "medium" | "hard";
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// Game-related union types
export type GameType = "checkin" | "wheel" | "scratch" | "quiz" | "shake";
export type GameCoinSource =
  | "checkin" | "wheel" | "scratch" | "quiz" | "shake"
  | "achievement" | "store" | "ranking" | "admin";

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience aliases
export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Service = Tables<"services">;
export type AppointmentService = Tables<"appointment_services">;
export type WorkingHour = Tables<"working_hours">;
export type BlockedSlot = Tables<"blocked_slots">;
export type Appointment = Tables<"appointments">;
export type Review = Tables<"reviews">;
export type Payment = Tables<"payments">;
export type Notification = Tables<"notifications">;
export type LoyaltyRule = Tables<"loyalty_rules">;
export type LoyaltyHistory = Tables<"loyalty_history">;
export type Portfolio = Tables<"portfolio">;
export type Setting = Tables<"settings">;

// Gamification aliases
export type GameCoinsHistory = Tables<"game_coins_history">;
export type MinigamePlay = Tables<"minigame_plays">;
export type Achievement = Tables<"achievements">;
export type UserAchievement = Tables<"user_achievements">;
export type RewardStoreItem = Tables<"reward_store_items">;
export type RewardRedemption = Tables<"reward_redemptions">;
export type GameConfig = Tables<"game_config">;
export type QuizQuestion = Tables<"quiz_questions">;

// Extended types (with joins)
export type ServiceWithCategory = Service & {
  categories: Category;
};

export type AppointmentServiceWithDetails = AppointmentService & {
  services: Service;
};

export type AppointmentWithDetails = Appointment & {
  services: ServiceWithCategory | null;
  appointment_services?: AppointmentServiceWithDetails[];
  profiles: Profile;
};

// Gamification config types
export interface WheelSegment {
  label: string;
  coins: number;
  weight: number;
  color: string;
}

export interface WheelConfig {
  segments: WheelSegment[];
}

export interface ScratchPrize {
  symbols: number;
  label: string;
  coins: number;
  weight: number;
}

export interface ScratchConfig {
  prizes: ScratchPrize[];
  symbol_options: string[];
}

export interface QuizConfig {
  time_limit_seconds: number;
  correct_coins: number;
  wrong_coins: number;
  timeout_coins: number;
}

export interface ShakeWeightRange {
  range: [number, number];
  weight: number;
}

export interface ShakeConfig {
  min_coins: number;
  max_coins: number;
  weights: ShakeWeightRange[];
}

export interface CheckinConfig {
  base_coins: number;
  streak_bonus_interval: number;
  streak_bonus_amount: number;
  progressive_bonus_per_day: number;
  max_progressive_bonus_days: number;
}

// Player stats for the game hub
export interface PlayerGameStats {
  game_coins: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  today_plays: Record<GameType, boolean>;
}

// Achievement with unlock status
export type AchievementWithStatus = Achievement & {
  unlocked_at?: string | null;
};
