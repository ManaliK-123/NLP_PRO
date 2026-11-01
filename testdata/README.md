# Test Data Directory

This directory contains test media assets and fixtures for validating the end-to-end Meeting-to-Execution pipeline.

## Media Files

| File | Format | Duration | Purpose |
| :--- | :--- | :--- | :--- |
| `sample_meeting.mp4` | Video (H.264 / AAC 640x360) | 28.5s | Validates video upload, FFmpeg audio demuxing, faster-whisper transcription, and synchronized UI video replay. |
| `sample_meeting.wav` | Audio (PCM 16kHz 16-bit Mono) | 28.5s | Validates direct audio upload and Whisper transcription without video overhead. |
| `ES2002d.Corner.avi` | Video (MPEG-4 Simple Profile 352x288 @ 25fps) | 44m 47s | AMI corpus synchronized corner room video signal. |
| `ES2002d.Mix-Headset.wav` | Audio (PCM 16kHz 16-bit Mono @ 256 kbps) | 43m 44s | AMI corpus synchronized headset mix audio signal. |

## Spoken Transcript & Timestamp Ground Truth

The sample media simulates the 7-turn sprint synchronization meeting:

1. `[00:00 - 00:03.4]` **Alex**: *"Alright team, let's start the sync. Rahul, complete the dataset by Wednesday."*
2. `[00:03.8 - 00:07.5]` **Rahul**: *"Sure, I'll clean the labels and push to the repo. After that, Priya will train the baseline model."*
3. `[00:07.9 - 00:11.2]` **Priya**: *"Yes, I will take care of model training once Rahul finishes preprocessing."*
4. `[00:11.6 - 00:15.0]` **Alex**: *"We haven't decided which architecture to use for the classifier."*
5. `[00:15.3 - 00:19.1]` **Rahul**: *"Let's discuss that in Friday's meeting with the professor."*
6. `[00:19.5 - 00:24.0]` **Priya**: *"Wait, actually, the report submission is Thursday, not Friday."*
7. `[00:24.5 - 00:28.2]` **Alex**: *"Good catch! Someone should update the project documentation right away."*

## Expected Extracted Intelligence

- **Tasks**:
  - `Complete dataset preprocessing & label cleaning` → Owner: **Rahul**, Deadline: **Wednesday**, Priority: **High**.
  - `Train baseline model` → Owner: **Priya**, Status: **Blocked** (by Dataset).
  - `Update project documentation` → Owner: **Unassigned**, Status: **Needs Clarification** (Ambiguous).
- **Decisions**:
  - `Model Architecture Selection` → Status: **Undecided** (*"We haven't decided which architecture to use"*).
- **Conflicts**:
  - `Report Submission Deadline Discrepancy` → Thursday vs Friday (*"Friday's meeting"* vs *"submission is Thursday, not Friday"*).
- **Workflow DAG**:
  - `Complete Dataset` → *(blocks)* → `Train Model` → *(requires decision)* → `Model Architecture` → *(schedule discrepancy)* → `Report Submission`.
- **Execution Radar**:
  - Health Status: **At Risk** (due to 1 blocking dependency, 1 undecided architecture matter, 1 deadline conflict, and 1 unassigned task).

## How to Run Automated Smoke Test

Run from repository root:
```powershell
.\scripts\pipeline_smoke_test.ps1
```
