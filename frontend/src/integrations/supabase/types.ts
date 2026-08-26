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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      fir_details: {
        Row: {
          "Accused Count": number | null
          "Accused_ChargeSheeted Count": number | null
          ActSection: string | null
          "Age 0": number | null
          "Arrested Count\tNo.": number | null
          "Arrested Female": number | null
          "Arrested Male": number | null
          Beat_Name: string | null
          Boy: number | null
          Complaint_Mode: string | null
          "Conviction Count": number | null
          CrimeGroup_Name: string | null
          CrimeHead_Name: string | null
          "Distance from PS": string | null
          District_Name: string | null
          Female: number | null
          "FIR Type": string | null
          FIR_Day: number | null
          FIR_MONTH: number | null
          FIR_Stage: string | null
          FIR_YEAR: number | null
          Girl: number | null
          Internal_IO: number | null
          IOName: string | null
          KGID: string | null
          Latitude: string | null
          Longitude: string | null
          Male: number | null
          Offence_Duration: number | null
          "Place of Offence": string | null
          Unit_ID: number | null
          UnitName: string | null
          "VICTIM COUNT": number | null
          Village_Area_Name: string | null
        }
        Insert: {
          "Accused Count"?: number | null
          "Accused_ChargeSheeted Count"?: number | null
          ActSection?: string | null
          "Age 0"?: number | null
          "Arrested Count\tNo."?: number | null
          "Arrested Female"?: number | null
          "Arrested Male"?: number | null
          Beat_Name?: string | null
          Boy?: number | null
          Complaint_Mode?: string | null
          "Conviction Count"?: number | null
          CrimeGroup_Name?: string | null
          CrimeHead_Name?: string | null
          "Distance from PS"?: string | null
          District_Name?: string | null
          Female?: number | null
          "FIR Type"?: string | null
          FIR_Day?: number | null
          FIR_MONTH?: number | null
          FIR_Stage?: string | null
          FIR_YEAR?: number | null
          Girl?: number | null
          Internal_IO?: number | null
          IOName?: string | null
          KGID?: string | null
          Latitude?: string | null
          Longitude?: string | null
          Male?: number | null
          Offence_Duration?: number | null
          "Place of Offence"?: string | null
          Unit_ID?: number | null
          UnitName?: string | null
          "VICTIM COUNT"?: number | null
          Village_Area_Name?: string | null
        }
        Update: {
          "Accused Count"?: number | null
          "Accused_ChargeSheeted Count"?: number | null
          ActSection?: string | null
          "Age 0"?: number | null
          "Arrested Count\tNo."?: number | null
          "Arrested Female"?: number | null
          "Arrested Male"?: number | null
          Beat_Name?: string | null
          Boy?: number | null
          Complaint_Mode?: string | null
          "Conviction Count"?: number | null
          CrimeGroup_Name?: string | null
          CrimeHead_Name?: string | null
          "Distance from PS"?: string | null
          District_Name?: string | null
          Female?: number | null
          "FIR Type"?: string | null
          FIR_Day?: number | null
          FIR_MONTH?: number | null
          FIR_Stage?: string | null
          FIR_YEAR?: number | null
          Girl?: number | null
          Internal_IO?: number | null
          IOName?: string | null
          KGID?: string | null
          Latitude?: string | null
          Longitude?: string | null
          Male?: number | null
          Offence_Duration?: number | null
          "Place of Offence"?: string | null
          Unit_ID?: number | null
          UnitName?: string | null
          "VICTIM COUNT"?: number | null
          Village_Area_Name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      fir_mv_by_crime_group: {
        Row: {
          count: number | null
          crime_group: string | null
        }
        Relationships: []
      }
      fir_mv_by_crime_head: {
        Row: {
          count: number | null
          crime_head: string | null
        }
        Relationships: []
      }
      fir_mv_by_district: {
        Row: {
          count: number | null
          district: string | null
        }
        Relationships: []
      }
      fir_mv_by_month: {
        Row: {
          count: number | null
          month: number | null
        }
        Relationships: []
      }
      fir_mv_by_year: {
        Row: {
          count: number | null
          year: number | null
        }
        Relationships: []
      }
      fir_mv_by_year_crime_group: {
        Row: {
          count: number | null
          crime_group: string | null
          year: number | null
        }
        Relationships: []
      }
      fir_mv_by_year_district: {
        Row: {
          count: number | null
          district: string | null
          year: number | null
        }
        Relationships: []
      }
      fir_mv_complaint_mode: {
        Row: {
          complaint_mode: string | null
          count: number | null
        }
        Relationships: []
      }
      fir_mv_filter_options: {
        Row: {
          complaint_modes: Json | null
          crime_groups: Json | null
          districts: Json | null
          fir_stages: Json | null
          years: Json | null
        }
        Relationships: []
      }
      fir_mv_fir_stage: {
        Row: {
          count: number | null
          fir_stage: string | null
        }
        Relationships: []
      }
      fir_mv_geo_districts: {
        Row: {
          district: string | null
          fir_count: number | null
          lat: number | null
          lng: number | null
          victims: number | null
        }
        Relationships: []
      }
      fir_mv_place: {
        Row: {
          count: number | null
          place: string | null
        }
        Relationships: []
      }
      fir_mv_top_units: {
        Row: {
          count: number | null
          district: string | null
          unit_name: string | null
        }
        Relationships: []
      }
      fir_mv_totals: {
        Row: {
          arrested_female: number | null
          arrested_male: number | null
          boy_victims: number | null
          female_victims: number | null
          girl_victims: number | null
          male_victims: number | null
          total_accused: number | null
          total_arrested: number | null
          total_chargesheeted: number | null
          total_convictions: number | null
          total_firs: number | null
          total_victims: number | null
        }
        Relationships: []
      }
      fir_mv_victim_by_crime: {
        Row: {
          boy: number | null
          crime_group: string | null
          female: number | null
          girl: number | null
          male: number | null
        }
        Relationships: []
      }
      fir_mv_yearly_trend: {
        Row: {
          arrested_female: number | null
          arrested_male: number | null
          total_arrested: number | null
          total_chargesheeted: number | null
          total_convicted: number | null
          total_firs: number | null
          total_victims: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _fir_exec: { Args: { sql: string }; Returns: Json }
      _fir_wc: {
        Args: {
          p_crime_groups: string[]
          p_districts: string[]
          p_fir_stages: string[]
          p_years: number[]
        }
        Returns: string
      }
      _fir_where: {
        Args: {
          p_crime_groups: string[]
          p_districts: string[]
          p_fir_stages: string[]
          p_years: number[]
        }
        Returns: string
      }
      fir_accused_vs_arrested: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_complaint_mode: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_crime_group: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_crime_head: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_district: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_fir_stage: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_month: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_place: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_year: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_year_crime_group: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_by_year_district: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_district_deep_dive: {
        Args: {
          p_crime_groups?: string[]
          p_district: string
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_filter_options: { Args: never; Returns: Json }
      fir_geo_beats: { Args: never; Returns: Json }
      fir_geo_districts: { Args: never; Returns: Json }
      fir_kpi_totals: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_top_units: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_limit?: number
          p_years?: number[]
        }
        Returns: Json
      }
      fir_victim_demographics: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_victim_demographics_by_crime: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
        }
        Returns: Json
      }
      fir_yearly_trend: {
        Args: {
          p_crime_groups?: string[]
          p_districts?: string[]
          p_fir_stages?: string[]
          p_years?: number[]
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
  public: {
    Enums: {},
  },
} as const
