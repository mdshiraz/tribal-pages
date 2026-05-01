export interface Person {
  id: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  suffix: string | null
  gender: 'male' | 'female' | 'unknown'
  is_alive: boolean
  birth_precision: string | null
  birth_day: number | null
  birth_month: number | null
  birth_year: number | null
  birth_place: string | null
  death_precision: string | null
  death_day: number | null
  death_month: number | null
  death_year: number | null
  death_place: string | null
  birth_order: number | null
  is_adopted: boolean
  notes: string | null
  notes_private: boolean
  bio: string | null
  photo_url: string | null
  address: string | null
  phone: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface Marriage {
  id: string
  person_a_id: string
  person_b_id: string | null
  label: string | null
  order_num: number
  status: 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown'
  marriage_precision: string | null
  marriage_day: number | null
  marriage_month: number | null
  marriage_year: number | null
  marriage_place: string | null
  divorce_precision: string | null
  divorce_day: number | null
  divorce_month: number | null
  divorce_year: number | null
  divorce_place: string | null
  created_at: string
  updated_at: string
}

export interface ParentChild {
  id: string
  marriage_id: string | null
  child_id: string
  birth_order: number | null
  created_at: string
}

export interface PersonEvent {
  id: string
  person_id: string
  event_type: string
  event_name: string | null
  precision: string | null
  event_day: number | null
  event_month: number | null
  event_year: number | null
  event_place: string | null
  notes: string | null
  created_at: string
}

export interface Photo {
  id: string
  person_id: string
  url: string
  caption: string | null
  is_primary: boolean
  created_at: string
}

export interface Citation {
  id: string
  person_id: string
  source: string | null
  detail: string | null
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: 'admin' | 'member'
  created_at: string
}

// Composite types used in the UI

export interface MarriageWithSpouse extends Marriage {
  spouse: Person | null
  children: Person[]
}

export interface PersonWithFamily extends Person {
  marriages: MarriageWithSpouse[]
  parents: {
    father: Person | null
    mother: Person | null
    marriage: Marriage | null
  } | null
}

export type ViewMode = 'family' | 'names' | 'tree' | 'ancestors' | 'descendants' | 'kin' | 'reports' | 'printable'

export interface AuthState {
  user: import('@supabase/supabase-js').User | null
  role: 'admin' | 'member' | null
  loading: boolean
  viewAs: 'admin' | 'member'
}
