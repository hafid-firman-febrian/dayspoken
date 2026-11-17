export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      ask_logs: {
        Row: {
          answer: string;
          citations: NonNullable<Json>;
          created_at: string;
          id: string;
          local_date: string;
          question: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          answer: string;
          citations?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          local_date: string;
          question: string;
          user_id?: string;
        };
        Update: {
          answer?: string;
          citations?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          local_date?: string;
          question?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ask_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      entries: {
        Row: {
          audio_path: string;
          created_at: string;
          duration_sec: number;
          embedding: string | null;
          embedding_status: Database['public']['Enums']['embedding_status'];
          error_code: string | null;
          id: string;
          language: string | null;
          local_date: string;
          mood: number | null;
          mood_source: Database['public']['Enums']['mood_source'] | null;
          prompt: string | null;
          recorded_at: string;
          search: unknown;
          status: Database['public']['Enums']['entry_status'];
          summary: string | null;
          tags: string[];
          title: string | null;
          transcript: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          audio_path: string;
          created_at?: string;
          duration_sec: number;
          embedding?: string | null;
          embedding_status?: Database['public']['Enums']['embedding_status'];
          error_code?: string | null;
          id?: string;
          language?: string | null;
          local_date: string;
          mood?: number | null;
          mood_source?: Database['public']['Enums']['mood_source'] | null;
          prompt?: string | null;
          recorded_at: string;
          search?: never;
          status?: Database['public']['Enums']['entry_status'];
          summary?: string | null;
          tags?: string[];
          title?: string | null;
          transcript?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          audio_path?: string;
          created_at?: string;
          duration_sec?: number;
          embedding?: string | null;
          embedding_status?: Database['public']['Enums']['embedding_status'];
          error_code?: string | null;
          id?: string;
          language?: string | null;
          local_date?: string;
          mood?: number | null;
          mood_source?: Database['public']['Enums']['mood_source'] | null;
          prompt?: string | null;
          recorded_at?: string;
          search?: never;
          status?: Database['public']['Enums']['entry_status'];
          summary?: string | null;
          tags?: string[];
          title?: string | null;
          transcript?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'entries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      plan_limits: {
        Row: {
          asks_per_day: number;
          plan: string;
          recordings_per_day: number;
        };
        ComputedFields: never;
        Insert: {
          asks_per_day: number;
          plan: string;
          recordings_per_day: number;
        };
        Update: {
          asks_per_day?: number;
          plan?: string;
          recordings_per_day?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          is_demo: boolean;
          plan: string;
          reminder_time: string | null;
          timezone: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id: string;
          is_demo?: boolean;
          plan?: string;
          reminder_time?: string | null;
          timezone?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          plan?: string;
          reminder_time?: string | null;
          timezone?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_plan_fkey';
            columns: ['plan'];
            isOneToOne: false;
            referencedRelation: 'plan_limits';
            referencedColumns: ['plan'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ping: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: {
      embedding_status: 'pending' | 'ready' | 'failed';
      entry_status: 'uploading' | 'transcribing' | 'analyzing' | 'ready' | 'failed';
      mood_source: 'ai' | 'user';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      embedding_status: ['pending', 'ready', 'failed'],
      entry_status: ['uploading', 'transcribing', 'analyzing', 'ready', 'failed'],
      mood_source: ['ai', 'user'],
    },
  },
} as const;
