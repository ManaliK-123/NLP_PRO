import { MeetingDetail, MeetingListItem, DashboardAnalytics, Project, Task } from '../types';

const API_BASE = '/api';

export async function fetchAnalytics(): Promise<DashboardAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchMeetings(): Promise<MeetingListItem[]> {
  const res = await fetch(`${API_BASE}/meetings`);
  if (!res.ok) throw new Error('Failed to fetch meetings');
  return res.json();
}

export async function fetchMeetingDetail(id: number): Promise<MeetingDetail> {
  const res = await fetch(`${API_BASE}/meetings/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch meeting #${id}`);
  return res.json();
}

export async function createMeeting(data: {
  title: string;
  project_name?: string;
  agenda?: string;
  language?: string;
  participants?: string;
}): Promise<MeetingDetail> {
  const res = await fetch(`${API_BASE}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create meeting');
  return res.json();
}

export async function validateMedia(videoFile?: File | null, audioFile?: File | null): Promise<any> {
  const formData = new FormData();
  if (videoFile) formData.append('video_file', videoFile);
  if (audioFile) formData.append('audio_file', audioFile);
  
  const res = await fetch(`${API_BASE}/meetings/validate-media`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Media validation failed');
  return res.json();
}

export async function uploadMeetingMediaFiles(
  meetingId: number,
  options: { videoFile?: File | null; audioFile?: File | null; file?: File | null },
  autoProcess = true
) {
  const formData = new FormData();
  if (options.videoFile) formData.append('video_file', options.videoFile);
  if (options.audioFile) formData.append('audio_file', options.audioFile);
  if (options.file && !options.videoFile && !options.audioFile) {
    formData.append('file', options.file);
  }

  const res = await fetch(`${API_BASE}/meetings/${meetingId}/upload?auto_process=${autoProcess}`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload media files' }));
    throw new Error(err.detail || 'Failed to upload media files');
  }
  return res.json();
}

export async function uploadMeetingMedia(meetingId: number, file: File, autoProcess = true) {
  return uploadMeetingMediaFiles(meetingId, { file }, autoProcess);
}

export async function triggerMeetingProcessing(meetingId: number, sync = false) {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/process?sync=${sync}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to trigger processing');
  return res.json();
}

export async function fetchMeetingWorkflow(meetingId: number) {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/workflow`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export async function askMeetingQuestion(meetingId: number, question: string) {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!res.ok) throw new Error('Failed to ask assistant');
  return res.json();
}

export async function updateTask(taskId: number, updates: Partial<Task> & { note?: string }): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error(`Failed to update task #${taskId}`);
  return res.json();
}

export async function fetchTasks(filters?: { owner?: string; status?: string; search?: string }): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.owner) params.append('owner', filters.owner);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  const res = await fetch(`${API_BASE}/tasks?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProjectMemory(projectId: number) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/memory`);
  if (!res.ok) throw new Error('Failed to fetch project memory');
  return res.json();
}

export async function updateSpeaker(meetingId: number, speakerId: number, displayName: string, role?: string) {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/speakers/${speakerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name: displayName, role })
  });
  if (!res.ok) throw new Error('Failed to update speaker');
  return res.json();
}

export async function fetchEvaluationBenchmark() {
  const res = await fetch(`${API_BASE}/evaluation/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch NLP evaluation benchmark');
  return res.json();
}
