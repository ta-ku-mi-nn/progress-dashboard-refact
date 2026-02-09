export interface EikenResult {
  id: number;
  student_id: number;
  exam_date: string;
  grade: string;
  score: number;
  result: string;
}

export interface DashboardSummary {
  total_progress: number;
  latest_eiken: {
    grade: string;
    score: number;
    result: string;
  } | null;
}

export interface ProgressItem {
  id: number;
  subject: string;
  reference_book: string;
  completed_units: number;
  total_units: number;
}
