export interface Speaker {
  id: number;
  meeting_id: number;
  original_label: string;
  display_name: string;
  role?: string;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker_label: string;
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

export interface TaskHistory {
  id: number;
  task_id: number;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  note?: string;
  created_at: string;
}

export interface Task {
  id: number;
  meeting_id: number;
  project_id?: number;
  title: string;
  description?: string;
  owner: string;
  deadline_text?: string;
  deadline_normalized?: string;
  deadline_status: string;
  status: string;
  priority: string;
  confidence: number;
  evidence_quote?: string;
  evidence_timestamp?: number;
  evidence_segment_id?: number;
  created_at: string;
  updated_at: string;
  history?: TaskHistory[];
}

export interface Decision {
  id: number;
  meeting_id: number;
  project_id?: number;
  topic?: string;
  decision: string;
  status: string;
  participants?: string;
  evidence_quote?: string;
  evidence_timestamp?: number;
  confidence: number;
  supersedes_previous_decision: boolean;
  previous_decision_id?: number;
  drift_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Conflict {
  id: number;
  meeting_id: number;
  topic: string;
  statement_a: string;
  speaker_a?: string;
  timestamp_a?: number;
  statement_b: string;
  speaker_b?: string;
  timestamp_b?: number;
  status: string;
  resolution?: string;
  created_at: string;
}

export interface Question {
  id: number;
  meeting_id: number;
  question: string;
  asked_by?: string;
  status: string;
  answer?: string;
  evidence_quote?: string;
  evidence_timestamp?: number;
}

export interface Dependency {
  id: number;
  meeting_id: number;
  source_item_type: string;
  source_label: string;
  target_item_type: string;
  target_label: string;
  relation_type: string;
  evidence_quote?: string;
  evidence_timestamp?: number;
}

export interface Entity {
  id: number;
  meeting_id: number;
  text: string;
  label: string;
  evidence_timestamp?: number;
}

export interface MediaValidationResult {
  valid: boolean;
  status: 'valid' | 'warning' | 'error';
  message: string;
  video_detected?: boolean;
  audio_detected?: boolean;
  video_duration?: number;
  audio_duration?: number;
  video_codec?: string;
  audio_codec?: string;
  mode: 'paired' | 'single';
}

export interface MeetingDetail {
  id: number;
  project_id?: number;
  project_name?: string;
  title: string;
  meeting_date: string;
  duration_seconds: number;
  agenda?: string;
  media_path?: string;
  media_type: string;
  video_path?: string;
  audio_path?: string;
  playback_path?: string;
  audio_source?: string;
  video_source?: string;
  external_audio_name?: string;
  video_duration?: number;
  audio_duration?: number;
  media_validation_status?: string;
  media_validation_message?: string;
  status: string;
  processing_step?: string;
  error_message?: string;
  language: string;
  actionability_score: number;
  summary?: string;
  mom_json?: any;
  ai_provider: string;
  created_at: string;
  speakers: Speaker[];
  segments: TranscriptSegment[];
  tasks: Task[];
  decisions: Decision[];
  conflicts: Conflict[];
  questions: Question[];
  dependencies: Dependency[];
  entities: Entity[];
}

export interface MeetingListItem {
  id: number;
  project_id?: number;
  project_name?: string;
  title: string;
  meeting_date: string;
  duration_seconds: number;
  status: string;
  processing_step?: string;
  media_type: string;
  audio_source?: string;
  video_source?: string;
  external_audio_name?: string;
  video_duration?: number;
  audio_duration?: number;
  media_validation_status?: string;
  actionability_score: number;
  created_at: string;
  task_count: number;
  decision_count: number;
  conflict_count: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  meeting_count: number;
  task_count: number;
  health_status: string;
}

export interface ExecutionRadarData {
  health_status: 'Healthy' | 'At Risk' | 'Critical';
  completion_rate: number;
  blocked_rate: number;
  total_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
  clarification_tasks: number;
  unresolved_decisions: number;
  conflict_count: number;
  imminent_deadlines: number;
  reasons: string[];
  radar_data: Array<{ subject: string; score: number; fullMark: number }>;
}

export interface DashboardAnalytics {
  total_meetings: number;
  completed_meetings: number;
  avg_actionability: number;
  radar: ExecutionRadarData;
  recent_meetings: Array<{
    id: number;
    title: string;
    date: string;
    status: string;
    actionability_score: number;
    task_count: number;
    conflict_count: number;
  }>;
  upcoming_tasks: Array<{
    id: number;
    title: string;
    owner: string;
    deadline: string;
    deadline_status: string;
    priority: string;
    status: string;
    meeting_id: number;
  }>;
  active_ai_provider: {
    mode: string;
    is_local: boolean;
    model_name: string;
    offline_ready: boolean;
  };
}
