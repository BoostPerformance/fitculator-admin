// Daily Program Types
// Matches DB schema: supabase/migrations/20260219_daily_programming_system.sql

export type ProgramStatus = 'draft' | 'published' | 'archived';
export type CardType = 'workout' | 'warmup' | 'cooldown' | 'strength' | 'skill' | 'custom';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';

export interface DailyProgram {
 id: string;
 challenge_id: string;
 date: string; // DATE format: 'YYYY-MM-DD'
 title: string | null;
 description: string | null;
 status: ProgramStatus;
 show_on_main: boolean;
 created_by: string | null;
 updated_by: string | null;
 published_at: string | null;
 created_at: string;
 updated_at: string;
 // Joined relations
 daily_program_cards?: DailyProgramCard[];
 daily_program_target_groups?: { group_id: string }[];
}

export interface DailyProgramCard {
 id: string;
 program_id: string;
 title: string;
 body: TiptapDocument | null; // Tiptap JSON
 card_type: CardType;
 sort_order: number;
 coaching_tips: string | null;
 has_check: boolean;
 requires_approval: boolean;
 score_value: number;
 workout_date_start: string | null; // DATE
 workout_date_end: string | null; // DATE
 submission_start: string | null; // TIMESTAMPTZ
 submission_end: string | null; // TIMESTAMPTZ
 created_at: string;
 updated_at: string;
}

export interface DailyProgramCompletion {
 id: string;
 card_id: string;
 user_id: string;
 workout_id: string | null;
 verification_status: VerificationStatus;
 verified_by: string | null;
 verified_at: string | null;
 completed_at: string;
 created_at: string;
 // Joined relations
 users?: { id: string; name: string; username: string; profile_image_url?: string };
 daily_program_cards?: DailyProgramCard & {
 challenge_daily_programs?: { id: string; date: string; title: string | null; challenge_id: string };
 };
}

export interface ChallengeGroup {
 id: string;
 name: string;
 description?: string;
 color_code?: string;
 sort_order: number;
}

// Tiptap JSON document format (compatible with Flutter TiptapHtmlConverter)
export interface TiptapDocument {
 type: 'doc';
 content: TiptapNode[];
}

export interface TiptapNode {
 type: string;
 attrs?: Record<string, unknown>;
 content?: TiptapNode[];
 marks?: TiptapMark[];
 text?: string;
}

export interface TiptapMark {
 type: string;
 attrs?: Record<string, unknown>;
}

// Form data types
export interface DailyProgramFormData {
 date: string;
 title: string;
 description?: string;
 show_on_main: boolean;
 target_group_ids: string[];
}

export interface DailyProgramCardFormData {
 title: string;
 body?: TiptapDocument | null;
 card_type: CardType;
 coaching_tips?: string;
 has_check: boolean;
 requires_approval: boolean;
 score_value: number;
 workout_date_start?: string;
 workout_date_end?: string;
 submission_start?: string;
 submission_end?: string;
}

// Calendar view types
export type CalendarViewMode = 'month' | 'week';

export interface CalendarDay {
 date: string; // YYYY-MM-DD
 isCurrentMonth: boolean;
 isToday: boolean;
 programs: DailyProgram[];
}
