export interface Database {
  public: {
    Tables: {
      reviews: {
        Row: {
          id: string
          name: string
          email: string
          rating: number
          comment: string
          stay_date: string | null
          approved: boolean
        }
        Insert: {
          id?: string
          name: string
          email: string
          rating: number
          comment: string
          stay_date?: string | null
          approved?: boolean
        }
        Update: {
          id?: string
          name?: string
          email?: string
          rating?: number
          comment?: string
          stay_date?: string | null
          approved?: boolean
        }
      }
      // Add other tables as needed
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
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
  }
}