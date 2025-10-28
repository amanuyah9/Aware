export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          email: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          email: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          email?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_end: string | null
          courses_limit: number
          scans_limit: number
          scans_used_this_month: number
          last_scan_reset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          courses_limit?: number
          scans_limit?: number
          scans_used_this_month?: number
          last_scan_reset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          courses_limit?: number
          scans_limit?: number
          scans_used_this_month?: number
          last_scan_reset?: string
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          user_id: string
          title: string
          teacher: string | null
          term: string | null
          grading_model: string
          categories: Json
          linked_scans: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          teacher?: string | null
          term?: string | null
          grading_model?: string
          categories?: Json
          linked_scans?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          teacher?: string | null
          term?: string | null
          grading_model?: string
          categories?: Json
          linked_scans?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          user_id: string
          title: string
          category_id: string
          date: string
          earned_points: number
          total_points: number
          extra_credit: boolean
          status: string
          source_scan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          title: string
          category_id: string
          date: string
          earned_points: number
          total_points: number
          extra_credit?: boolean
          status?: string
          source_scan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          title?: string
          category_id?: string
          date?: string
          earned_points?: number
          total_points?: number
          extra_credit?: boolean
          status?: string
          source_scan_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scans: {
        Row: {
          id: string
          user_id: string
          image_urls: string[]
          ocr_texts: string[]
          parsed_parts: Json[]
          merged: Json | null
          merged_course_id: string | null
          status: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_urls?: string[]
          ocr_texts?: string[]
          parsed_parts?: Json[]
          merged?: Json | null
          merged_course_id?: string | null
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_urls?: string[]
          ocr_texts?: string[]
          parsed_parts?: Json[]
          merged?: Json | null
          merged_course_id?: string | null
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      insights: {
        Row: {
          id: string
          user_id: string
          course_id: string
          insight_type: string
          content: Json
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          insight_type: string
          content: Json
          generated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          insight_type?: string
          content?: Json
          generated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
  }
}
