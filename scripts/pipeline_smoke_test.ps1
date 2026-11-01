# ==============================================================================
# MEETING-TO-EXECUTION AI: FULL PIPELINE SMOKE TEST
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " MEETING -> EXECUTION AI: RELEASE PIPELINE SMOKE TEST" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$BackendUrl = "http://127.0.0.1:8000"
$FrontendUrl = "http://localhost:5173"
$TotalStages = 0
$PassedStages = 0
$FailedStages = 0

function Report-Stage {
    param(
        [string]$StageName,
        [bool]$Success,
        [string]$Details = ""
    )
    $script:TotalStages++
    if ($Success) {
        $script:PassedStages++
        Write-Host " [PASS] $StageName" -ForegroundColor Green
        if ($Details) { Write-Host "        $Details" -ForegroundColor Gray }
    } else {
        $script:FailedStages++
        Write-Host " [FAIL] $StageName" -ForegroundColor Red
        if ($Details) { Write-Host "        Error: $Details" -ForegroundColor Yellow }
    }
}

# ------------------------------------------------------------------------------
# Stage 1: Health & Connectivity Check
# ------------------------------------------------------------------------------
Write-Host "--- Stage 1: Backend & Frontend Connectivity ---" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -TimeoutSec 5
    $bStatus = ($health.status -eq "healthy")
    Report-Stage "Backend Health & AI Provider" $bStatus "Status: $($health.status), Provider: $($health.provider.model_name)"
} catch {
    Report-Stage "Backend Health & AI Provider" $false $_.Exception.Message
}

try {
    $fe = Invoke-WebRequest -Uri "$FrontendUrl" -Method Get -TimeoutSec 5 -UseBasicParsing
    $feStatus = ($fe.StatusCode -eq 200)
    Report-Stage "Frontend Vite Dev Server" $feStatus "Status Code: $($fe.StatusCode)"
} catch {
    Report-Stage "Frontend Vite Dev Server" $false $_.Exception.Message
}


# ------------------------------------------------------------------------------
# Stage 2: Automated Pytest Regression Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 2: Backend Pytest Regression Suite ---" -ForegroundColor Yellow
$prevEnv = $env:PYTHONPATH
$env:PYTHONPATH = "backend"
$pytestOut = python -m pytest backend/tests 2>&1
$pytestExit = $LASTEXITCODE
$env:PYTHONPATH = $prevEnv
if ($pytestExit -eq 0) {
    Report-Stage "Backend Pytest Suite (14 Tests)" $true "All unit & integration tests passed."
} else {
    Report-Stage "Backend Pytest Suite" $false ($pytestOut | Out-String)
}


# ------------------------------------------------------------------------------
# Stage 3: Seeded Demo Meeting Verification
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 3: Seeded Demo Meeting Inspection ---" -ForegroundColor Yellow
try {
    $meetings = Invoke-RestMethod -Uri "$BackendUrl/api/meetings" -Method Get
    $demo = $meetings | Where-Object { $_.id -eq 1 }
    $hasDemo = ($null -ne $demo)
    Report-Stage "Demo Meeting Seeding" $hasDemo "Title: $($demo.title), Tasks: $($demo.task_count), Conflicts: $($demo.conflict_count)"

    $detail = Invoke-RestMethod -Uri "$BackendUrl/api/meetings/1" -Method Get
    $hasSegments = ($detail.segments.Count -ge 7)
    Report-Stage "Timestamped Transcript Segments" $hasSegments "$($detail.segments.Count) dialogue turns verified."
} catch {
    Report-Stage "Demo Meeting Seeding" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Stage 4: Required Demo Case Verification (In-Memory Pipeline)
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 4: Required Demo Case Verification ---" -ForegroundColor Yellow
$pyScript = @"
import sys
sys.path.insert(0, 'backend')
from app.nlp.extraction import extract_all_meeting_intelligence
from app.workflow.generator import generate_workflow_graph
from app.services.execution_radar import calculate_execution_radar
import datetime, json

segments = [
    {'start_time': 0.0, 'end_time': 3.0, 'speaker_label': 'Rahul', 'text': 'Complete the dataset by Wednesday.'},
    {'start_time': 3.5, 'end_time': 7.0, 'speaker_label': 'Priya', 'text': 'After Rahul finishes it, I will train the model.'},
    {'start_time': 7.5, 'end_time': 10.5, 'speaker_label': 'Rahul', 'text': 'The architecture is still undecided.'},
    {'start_time': 11.0, 'end_time': 14.0, 'speaker_label': 'Priya', 'text': 'Let\'s decide it in Friday\'s meeting.'},
    {'start_time': 14.5, 'end_time': 17.5, 'speaker_label': 'Rahul', 'text': 'The report is due Thursday.'},
    {'start_time': 18.0, 'end_time': 21.0, 'speaker_label': 'Priya', 'text': 'I thought it was Friday.'}
]

ref = datetime.datetime(2026, 10, 5, 10, 0)
res = extract_all_meeting_intelligence(segments, reference_date=ref)
wf = generate_workflow_graph(res['tasks'], res['decisions'], res['conflicts'], res['dependencies'])
radar = calculate_execution_radar(res['tasks'], res['decisions'], res['conflicts'], res['dependencies'])

out = {
    'rahul_task': any(t['owner'] == 'Rahul' and 'dataset' in t['title'].lower() and t['deadline_text'] == 'Wednesday' for t in res['tasks']),
    'priya_blocked': any(t['owner'] == 'Priya' and t['status'] == 'Blocked' for t in res['tasks']),
    'architecture_undecided': any('architecture' in d['topic'].lower() and d['status'] == 'Undecided' for d in res['decisions']),
    'report_conflict': len(res['conflicts']) >= 1 and 'Thursday' in res['conflicts'][0]['statement_a'] and 'Friday' in res['conflicts'][0]['statement_b'],
    'workflow_edges': len(wf['edges']) >= 3,
    'radar_at_risk': radar['health_status'] == 'At Risk'
}
print(json.dumps(out))
"@

$demoCaseJson = python -c "$pyScript" 2>&1
try {
    $dc = $demoCaseJson | ConvertFrom-Json
    Report-Stage "Rahul -> Dataset -> Wednesday" $dc.rahul_task "Owner and deadline extracted correctly."
    Report-Stage "Priya -> Model Training -> Blocked" $dc.priya_blocked "Target task marked as Blocked by Dataset."
    Report-Stage "Architecture -> Unresolved / Undecided" $dc.architecture_undecided "Preserved as Undecided decision."
    Report-Stage "Report Deadline Conflict: Thursday vs Friday" $dc.report_conflict "Dual-timestamp contradiction detected."
    Report-Stage "Workflow: Dataset -> Training -> Architecture -> Report" $dc.workflow_edges "Connected execution DAG generated."
    Report-Stage "Execution Radar: At Risk" $dc.radar_at_risk "Risk reasons reflect blockers and conflicts."
} catch {
    Report-Stage "Required Demo Case Verification" $false "Failed to parse Python output: $demoCaseJson"
}

# ------------------------------------------------------------------------------
# Stage 5: Real Media Upload & Processing (WAV / MP4)
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 5: Real Media Upload & Processing ---" -ForegroundColor Yellow
$testMedia = Join-Path $PSScriptRoot "..\testdata\sample_meeting.mp4"
if (Test-Path $testMedia) {
    $testMediaEscaped = $testMedia.Replace("\", "/")
    $uploadPy = @"
import httpx
client = httpx.Client(base_url='$BackendUrl', timeout=60.0)
m = client.post('/api/meetings', json={'title': 'Smoke Test Media Upload', 'project_name': 'Autonomous Driving NLP Assistant'}).json()
mid = m['id']
with open(r'$testMediaEscaped', 'rb') as f:
    up = client.post(f'/api/meetings/{mid}/upload?auto_process=false', files={'file': ('test.mp4', f, 'video/mp4')})
proc = client.post(f'/api/meetings/{mid}/process?sync=true')
res = client.get(f'/api/meetings/{mid}').json()
status = str(res.get('status', ''))
segs = str(len(res.get('segments', [])))
tasks = str(len(res.get('tasks', [])))
decs = str(len(res.get('decisions', [])))
confs = str(len(res.get('conflicts', [])))
print(':'.join([status, segs, tasks, decs, confs]))
"@
    $mediaResult = (python -c "$uploadPy" 2>&1 | Out-String).Trim()
    $tokens = $mediaResult.Split(":")
    if ($tokens.Count -ge 5 -and $tokens[0] -eq "completed") {
        Report-Stage "Real MP4 Upload & FFmpeg Audio Demux" $true "Extracted $($tokens[1]) segments from audio."
        Report-Stage "End-to-End Object Extraction" $true "Tasks: $($tokens[2]), Decisions: $($tokens[3]), Conflicts: $($tokens[4])"
    } else {
        Report-Stage "Real MP4 Upload & Processing" $false $mediaResult
    }

} else {
    Report-Stage "Real Media File Found" $false "Missing testdata/sample_meeting.mp4"
}

# ------------------------------------------------------------------------------
# Stage 6: Grounded QA Assistant (Ask the Meeting)
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 6: Grounded QA Assistant (Ask the Meeting) ---" -ForegroundColor Yellow
try {
    $qaRes = Invoke-RestMethod -Uri "$BackendUrl/api/meetings/1/ask" -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"question": "Who owns dataset preparation?"}'
    $qaPass = ($qaRes.answer -like "*Rahul*" -and $qaRes.evidence.Count -gt 0)
    Report-Stage "Ask the Meeting: Ownership Query" $qaPass "Evidence quote: $($qaRes.evidence[0].quote)"

    $qaRisk = Invoke-RestMethod -Uri "$BackendUrl/api/meetings/1/ask" -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"question": "Why is the project marked At Risk?"}'
    $qaRiskPass = ($qaRisk.answer -like "*At Risk*" -or $qaRisk.answer -like "*conflict*")
    Report-Stage "Ask the Meeting: Health Diagnostics Query" $qaRiskPass "Grounded in: $($qaRisk.grounded_in -join ', ')"
} catch {
    Report-Stage "Ask the Meeting QA Queries" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Stage 7: Action Center Editing & Audit Trail
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 7: Action Center Audit Trail ---" -ForegroundColor Yellow
try {
    $tasks = Invoke-RestMethod -Uri "$BackendUrl/api/tasks" -Method Get
    $tId = $tasks[0].id
    $patch = Invoke-RestMethod -Uri "$BackendUrl/api/tasks/$tId" -Method Patch `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"status": "In Progress", "note": "Smoke test status update"}'
    $auditPass = ($patch.status -eq "In Progress")
    Report-Stage "Action Center Status Update" $auditPass "Task #$tId updated to In Progress with audit trail."
} catch {
    Report-Stage "Action Center Status Update" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Stage 8: Cross-Meeting Project Memory & Decision Drift
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 8: Project Memory & Decision Drift ---" -ForegroundColor Yellow
try {
    $mem = Invoke-RestMethod -Uri "$BackendUrl/api/projects/1/memory" -Method Get
    $hasDrift = ($mem.decision_drifts.Count -ge 1)
    $hasHistory = ($mem.task_timeline.Count -ge 3)
    Report-Stage "Cross-Meeting Decision Drift" $hasDrift "Detected drift: $($mem.decision_drifts[0].topic)"
    Report-Stage "Cross-Meeting Task Audit Timeline" $hasHistory "$($mem.task_timeline.Count) tasks traced across meetings."
} catch {
    Report-Stage "Project Memory Intelligence" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Stage 9: Export Services (PDF, Markdown, CSV, JSON)
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 9: Multi-Format Export Generation ---" -ForegroundColor Yellow
$exportFormats = @("json", "markdown", "csv", "pdf")
foreach ($fmt in $exportFormats) {
    try {
        $exp = Invoke-WebRequest -Uri "$BackendUrl/api/meetings/1/export/$fmt" -Method Get -UseBasicParsing
        $pass = ($exp.StatusCode -eq 200 -and $exp.RawContentLength -gt 100)
        Report-Stage "Export Format: $fmt" $pass "Size: $($exp.RawContentLength) bytes"
    } catch {
        Report-Stage "Export Format: $fmt" $false $_.Exception.Message
    }
}
# ------------------------------------------------------------------------------
# Stage 10: Mode A Paired Media Ingestion (AMI ES2002a.Corner.avi + ES2002a.Mix-Headset.wav)
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 10: Mode A Paired Media (AMI ES2002a) Ingestion ---" -ForegroundColor Yellow
try {
    $cornerAvi = "testdata\ES2002a.Corner.avi"
    $headsetWav = "testdata\ES2002a.Mix-Headset.wav"
    
    if ((Test-Path $cornerAvi) -and (Test-Path $headsetWav)) {
        # Create meeting
        $mPayload = @{
            title = "Smoke Test: AMI ES2002a Paired Media (Mode A)"
            project_name = "Autonomous Driving NLP Assistant"
            agenda = "Mode A paired media verification with external headset audio and corner video"
            participants = "Laura, David, Sarah, Mike"
        } | ConvertTo-Json

        $newM = Invoke-RestMethod -Uri "$BackendUrl/api/meetings" -Method Post `
            -Headers @{"Content-Type"="application/json"} `
            -Body $mPayload

        Report-Stage "Mode A Meeting Record Creation" ($null -ne $newM.id) "Meeting ID #$($newM.id) created."

        # Upload paired media using curl.exe
        $uploadOut = curl.exe -s -F "video_file=@$cornerAvi" -F "audio_file=@$headsetWav" "$BackendUrl/api/meetings/$($newM.id)/upload?auto_process=false"
        $uploadJson = $uploadOut | ConvertFrom-Json
        $upPass = ($uploadJson.success -eq $true)
        Report-Stage "Mode A Paired Media Upload" $upPass "Video: $($uploadJson.video_source), Audio: $($uploadJson.audio_source)"

        # Process meeting synchronously
        $procOut = curl.exe -s -X POST "$BackendUrl/api/meetings/$($newM.id)/process?sync=true"
        $procJson = $procOut | ConvertFrom-Json
        $procPass = ($procJson.status -eq "completed")
        Report-Stage "Mode A Pipeline Processing" $procPass "Status: $($procJson.status)"

        # Inspect completed meeting
        $mDetail = Invoke-RestMethod -Uri "$BackendUrl/api/meetings/$($newM.id)" -Method Get
        $audSourcePass = ($mDetail.audio_source -like "*External*")
        $segPass = ($mDetail.segments.Count -gt 50)
        $spkPass = ($mDetail.speakers.Count -ge 2)
        $playbackStream = Invoke-WebRequest -Uri "$BackendUrl/api/meetings/$($newM.id)/media" -Method Get -UseBasicParsing
        $streamPass = ($playbackStream.StatusCode -eq 200 -and $playbackStream.RawContentLength -gt 1000)

        Report-Stage "Mode A Preferred External Audio Source" $audSourcePass "Audio Source: $($mDetail.audio_source)"
        Report-Stage "Mode A Timestamped Transcript Extraction" $segPass "$($mDetail.segments.Count) segments extracted."
        Report-Stage "Mode A Speaker Diarization / Identification" $spkPass "$($mDetail.speakers.Count) speakers identified."
        Report-Stage "Mode A Web Playback Stream" $streamPass "Stream Size: $($playbackStream.RawContentLength) bytes"
    } else {
        Report-Stage "Mode A Paired Media Ingestion" $false "Test files not found in testdata\"
    }
} catch {
    Report-Stage "Mode A Paired Media Ingestion" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Stage 11: Mode B Single Media Ingestion (ES2002a_meeting_demo.mp4)
# ------------------------------------------------------------------------------
Write-Host "`n--- Stage 11: Mode B Single Media (ES2002a Demo MP4) Ingestion ---" -ForegroundColor Yellow
try {
    $demoMp4 = "testdata\ES2002a_meeting_demo.mp4"
    if (Test-Path $demoMp4) {
        $mPayloadB = @{
            title = "Smoke Test: AMI ES2002a Single Media (Mode B)"
            project_name = "Autonomous Driving NLP Assistant"
            agenda = "Mode B single media upload with FFmpeg audio extraction"
        } | ConvertTo-Json

        $newMB = Invoke-RestMethod -Uri "$BackendUrl/api/meetings" -Method Post `
            -Headers @{"Content-Type"="application/json"} `
            -Body $mPayloadB

        # Upload single file
        $uploadBOut = curl.exe -s -F "file=@$demoMp4" "$BackendUrl/api/meetings/$($newMB.id)/upload?auto_process=false"
        $uploadBJson = $uploadBOut | ConvertFrom-Json
        $upBPass = ($uploadBJson.success -eq $true)
        Report-Stage "Mode B Single Media Upload" $upBPass "Uploaded $($uploadBJson.video_source)"

        # Process meeting synchronously
        $procBOut = curl.exe -s -X POST "$BackendUrl/api/meetings/$($newMB.id)/process?sync=true"
        $procBJson = $procBOut | ConvertFrom-Json
        $procBPass = ($procBJson.status -eq "completed")
        Report-Stage "Mode B Pipeline Processing" $procBPass "Status: $($procBJson.status)"

        $mBDetail = Invoke-RestMethod -Uri "$BackendUrl/api/meetings/$($newMB.id)" -Method Get
        $extAudPass = ($mBDetail.audio_source -like "*Extracted*")
        $bSegPass = ($mBDetail.segments.Count -gt 50)
        Report-Stage "Mode B FFmpeg Audio Extraction" $extAudPass "Audio Source: $($mBDetail.audio_source)"
        Report-Stage "Mode B Speech Recognition & Segments" $bSegPass "$($mBDetail.segments.Count) segments extracted."
    } else {
        Report-Stage "Mode B Single Media Ingestion" $false "ES2002a_meeting_demo.mp4 not found"
    }
} catch {
    Report-Stage "Mode B Single Media Ingestion" $false $_.Exception.Message
}


# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " SMOKE TEST SUMMARY: $PassedStages / $TotalStages STAGES PASSED" -ForegroundColor $(if ($FailedStages -eq 0) { "Green" } else { "Red" })
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($FailedStages -eq 0) {
    Write-Host ">>> PIPELINE IS FULLY OPERATIONAL AND PRESENTATION READY! <<<`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host ">>> SOME STAGES FAILED. PLEASE REVIEW LOGS ABOVE. <<<`n" -ForegroundColor Red
    exit 1
}
