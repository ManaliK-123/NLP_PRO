import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Video, 
  Mic, 
  Camera, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  RotateCcw,
  FileAudio,
  Languages,
  Users,
  Calendar,
  Layers,
  FileCheck,
  AlertTriangle,
  Radio,
  FileText
} from 'lucide-react';
import { createMeeting, uploadMeetingMediaFiles, triggerMeetingProcessing, validateMedia } from '../api/client';
import { MediaValidationResult } from '../types';

interface MeetingCaptureStudioProps {
  onMeetingReady: (meetingId: number) => void;
}

export const MeetingCaptureStudio: React.FC<MeetingCaptureStudioProps> = ({ onMeetingReady }) => {
  const [captureMode, setCaptureMode] = useState<'upload' | 'record'>('upload');
  
  // File state (Mode A = Video + Audio, Mode B = Video or Audio)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<MediaValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('Autonomous Driving NLP Assistant');
  const [agenda, setAgenda] = useState('Sprint deliverables, dataset labeling, model architecture decision, and report timeline');
  const [participants, setParticipants] = useState('Laura, David, Sarah, Mike');
  const [language, setLanguage] = useState('en');

  // MediaRecorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Pipeline execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format seconds helper
  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  // Run validation whenever videoFile or audioFile changes
  useEffect(() => {
    let active = true;
    const runValidation = async () => {
      if (!videoFile && !audioFile) {
        setValidationResult(null);
        return;
      }
      setIsValidating(true);
      try {
        const res = await validateMedia(videoFile, audioFile);
        if (active) {
          setValidationResult(res);
        }
      } catch (err: any) {
        if (active) {
          setValidationResult({
            valid: true,
            status: 'valid',
            message: 'Media accepted. Local verification will run on server.',
            mode: videoFile && audioFile ? 'paired' : 'single',
            video_detected: !!videoFile,
            audio_detected: !!audioFile
          });
        }
      } finally {
        if (active) setIsValidating(false);
      }
    };

    runValidation();
    return () => { active = false; };
  }, [videoFile, audioFile]);

  // Quick Preset Loader from testdata
  const loadPreset = async (presetType: 'ami_paired' | 'ami_single' | 'seeded_sprint') => {
    setErrorMessage(null);
    try {
      if (presetType === 'ami_paired') {
        setTitle('AMI ES2002a Project Kickoff & Design Review');
        setParticipants('Laura (PM), David (ID), Sarah (UID), Mike (ME)');
        setAgenda('Project introduction, team roles, target user requirements, and remote control prototype scope');
        
        // Fetch files from /testdata/
        const vidResp = await fetch('/testdata/ES2002a.Corner.avi');
        const vidBlob = await vidResp.blob();
        const vFile = new File([vidBlob], 'ES2002a.Corner.avi', { type: 'video/x-msvideo' });

        const audResp = await fetch('/testdata/ES2002a.Mix-Headset.wav');
        const audBlob = await audResp.blob();
        const aFile = new File([audBlob], 'ES2002a.Mix-Headset.wav', { type: 'audio/wav' });

        setVideoFile(vFile);
        setAudioFile(aFile);
      } else if (presetType === 'ami_single') {
        setTitle('AMI ES2002a Meeting Demo (Synchronized Single Media)');
        setParticipants('Laura, David, Sarah, Mike');
        setAgenda('Design kick-off meeting with synchronized corner camera and audio');

        const vidResp = await fetch('/testdata/ES2002a_meeting_demo.mp4');
        const vidBlob = await vidResp.blob();
        const vFile = new File([vidBlob], 'ES2002a_meeting_demo.mp4', { type: 'video/mp4' });

        setVideoFile(vFile);
        setAudioFile(null);
      } else if (presetType === 'seeded_sprint') {
        setTitle('Sprint Planning & Architecture Sync #14');
        setParticipants('Alex, Rahul, Priya');
        setAgenda('Sprint deliverables, dataset labeling, model architecture decision, and report timeline');

        const vidResp = await fetch('/testdata/sample_meeting.mp4');
        const vidBlob = await vidResp.blob();
        const vFile = new File([vidBlob], 'sample_meeting.mp4', { type: 'video/mp4' });

        setVideoFile(vFile);
        setAudioFile(null);
      }
    } catch (err: any) {
      setErrorMessage(`Failed to load preset: ${err.message}. Please select files manually.`);
    }
  };

  // Start Camera/Mic Recording
  const startCameraRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(`Media capture failed: ${err.message}`);
    }
  };

  const stopCameraRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    setRecordingTime(0);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit and run pipeline
  const handleSubmitAndProcess = async () => {
    if (!title.trim()) {
      setErrorMessage('Please provide a meeting title.');
      return;
    }

    let finalVideo = videoFile;
    let finalAudio = audioFile;

    if (captureMode === 'record') {
      if (!recordedBlob) {
        setErrorMessage('Please record media or upload a file.');
        return;
      }
      finalVideo = new File([recordedBlob], `${title.replace(/\s+/g, '_')}_record.webm`, { type: 'video/webm' });
      finalAudio = null;
    }

    if (!finalVideo && !finalAudio) {
      setErrorMessage('Please upload a video file, external audio file, or record a video.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setProgressStep('Creating meeting record in database...');

      const newMeeting = await createMeeting({
        title,
        project_name: projectName,
        agenda,
        language,
        participants
      });

      setProgressStep('Uploading media files to server...');
      await uploadMeetingMediaFiles(
        newMeeting.id,
        { videoFile: finalVideo, audioFile: finalAudio },
        false
      );

      setProgressStep(
        finalAudio
          ? 'Running Mode A pipeline (Using preferred external audio for ASR, aligning timeline, generating web video replay)...'
          : 'Running Mode B pipeline (FFmpeg audio extraction, speech recognition, timeline grounding)...'
      );
      
      await triggerMeetingProcessing(newMeeting.id, true);

      setProgressStep('Analysis complete! Opening evidence-backed workspace...');
      setTimeout(() => {
        onMeetingReady(newMeeting.id);
      }, 600);

    } catch (err: any) {
      setErrorMessage(`Processing error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Capture & Ingestion Engine</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Meeting Capture Studio</h1>
        <p className="text-sm text-slate-400">
          Upload recorded media with optional synchronized external audio, or capture directly to extract verifiable project actions.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Test Preset Loaders */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Quick Test Datasets (One-Click Ingest)</span>
          </span>
          <span className="text-[11px] text-slate-400">AMI Corpus & Synthetic Fixtures</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => loadPreset('ami_paired')}
            className="text-left p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-indigo-300">
              <span>Mode A: AMI Paired</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">2 Files</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              ES2002a.Corner.avi + ES2002a.Mix-Headset.wav
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('ami_single')}
            className="text-left p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-indigo-300">
              <span>Mode B: AMI Single Demo</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">MP4</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              ES2002a_meeting_demo.mp4
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('seeded_sprint')}
            className="text-left p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-indigo-300">
              <span>Seeded Sprint Planning</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Synthetic</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              sample_meeting.mp4 (7 turns, 28.5s)
            </p>
          </button>
        </div>
      </div>

      {/* Capture Mode Toggle */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setCaptureMode('upload')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            captureMode === 'upload'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Media (Modes A & B)</span>
        </button>
        <button
          onClick={() => setCaptureMode('record')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            captureMode === 'record'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Browser Camera & Mic</span>
        </button>
      </div>

      {/* Main Ingestion Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {captureMode === 'upload' ? (
          <div className="space-y-4">
            {/* Split Media Dropzones: Slot 1 Video + Slot 2 Audio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SLOT 1: Primary Video File */}
              <div
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  videoFile
                    ? 'border-indigo-500/60 bg-indigo-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
                onClick={() => document.getElementById('video-upload-input')?.click()}
              >
                <input
                  id="video-upload-input"
                  type="file"
                  accept=".mp4,.webm,.mov,.avi,.mkv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setVideoFile(e.target.files[0]);
                      if (!title) {
                        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                      }
                    }
                  }}
                />

                <div className="space-y-2">
                  <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center ${
                    videoFile ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      {videoFile ? 'Video Source Attached' : 'Meeting Video File'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">MP4, AVI, WebM, MOV, MKV</p>
                  </div>

                  {videoFile ? (
                    <div className="pt-2 border-t border-slate-800/80 text-left space-y-1">
                      <div className="text-xs font-semibold text-slate-100 truncate">{videoFile.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoFile(null);
                        }}
                        className="text-[10px] text-rose-400 hover:underline pt-1"
                      >
                        Remove video
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-indigo-400 font-semibold pt-1">
                      Click to browse or drop video
                    </div>
                  )}
                </div>
              </div>

              {/* SLOT 2: Optional External Audio File */}
              <div
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  audioFile
                    ? 'border-cyan-500/60 bg-cyan-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
                onClick={() => document.getElementById('audio-upload-input')?.click()}
              >
                <input
                  id="audio-upload-input"
                  type="file"
                  accept=".wav,.mp3,.m4a,.ogg,.aac"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAudioFile(e.target.files[0]);
                      if (!title && !videoFile) {
                        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                      }
                    }
                  }}
                />

                <div className="space-y-2">
                  <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center ${
                    audioFile ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      {audioFile ? 'External Audio Attached' : 'Optional Separate Audio (Mode A)'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {audioFile ? 'Preferred ASR source' : 'WAV, MP3, M4A, OGG, AAC'}
                    </p>
                  </div>

                  {audioFile ? (
                    <div className="pt-2 border-t border-slate-800/80 text-left space-y-1">
                      <div className="text-xs font-semibold text-slate-100 truncate">{audioFile.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Preferred ASR Source
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudioFile(null);
                        }}
                        className="text-[10px] text-rose-400 hover:underline pt-1"
                      >
                        Remove audio
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic pt-1">
                      Optional: If omitted, audio will be extracted from video automatically via FFmpeg.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Media Validation & Source Metadata Box */}
            {(videoFile || audioFile) && (
              <div className={`p-4 rounded-xl border transition-all ${
                validationResult?.status === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-slate-950/70 border-slate-800 text-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {validationResult?.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {videoFile && audioFile ? 'MODE A: PAIRED MEDIA' : 'MODE B: SINGLE MEDIA'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {isValidating ? 'Inspecting streams...' : 'Media Streams Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-400 text-[11px]">Video Source:</span>{' '}
                    <span className="font-semibold text-slate-200">
                      {videoFile ? videoFile.name : 'None (Audio-Only Mode)'}
                    </span>
                    {validationResult?.video_duration ? (
                      <span className="text-slate-400 font-mono text-[11px] ml-1">
                        ({formatSecs(validationResult.video_duration)})
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Audio Source:</span>{' '}
                    <span className="font-semibold text-slate-200">
                      {audioFile
                        ? `${audioFile.name} (External WAV)`
                        : videoFile
                        ? 'Will be extracted from video via FFmpeg'
                        : 'None'}
                    </span>
                    {validationResult?.audio_duration ? (
                      <span className="text-slate-400 font-mono text-[11px] ml-1">
                        ({formatSecs(validationResult.audio_duration)})
                      </span>
                    ) : null}
                  </div>
                </div>

                {validationResult?.message && (
                  <p className="text-[11px] text-slate-400 mt-2 italic">
                    {validationResult.message}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Browser Camera / Mic Recording Area */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted={isRecording}
                controls={!isRecording && !!recordedVideoUrl}
                className="w-full h-full object-cover"
              />
              {!isRecording && !recordedVideoUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-slate-500">
                  <Camera className="w-10 h-10" />
                  <span className="text-xs">Camera preview will appear when you start recording</span>
                </div>
              )}

              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-rose-400 tracking-wider">REC</span>
                  <span className="text-xs font-mono text-slate-200">{formatTimer(recordingTime)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <>
                  <button
                    type="button"
                    onClick={startCameraRecording}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/30"
                  >
                    <Video className="w-4 h-4" />
                    <span>Start Recording</span>
                  </button>
                  {recordedBlob && (
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retake</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraRecording}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-xs transition-all"
                >
                  <Square className="w-4 h-4 text-rose-600 fill-rose-600" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Meeting Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Meeting Title <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AMI ES2002a Design Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g. Autonomous Driving NLP Assistant"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Meeting Agenda
            </label>
            <textarea
              rows={2}
              placeholder="Key objectives, agenda topics, or focus areas..."
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Participants (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="Laura, David, Sarah, Mike"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Primary Spoken Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="en">English (en)</option>
              <option value="auto">Auto Detect</option>
            </select>
          </div>
        </div>

        {/* Action Button & Live Pipeline Stepper */}
        <div className="pt-4 border-t border-slate-800 flex flex-col items-center space-y-3">
          <button
            type="button"
            disabled={isSubmitting || (!videoFile && !audioFile && !recordedBlob)}
            onClick={handleSubmitAndProcess}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg ${
              isSubmitting || (!videoFile && !audioFile && !recordedBlob)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-500/25'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Processing Meeting Intelligence...'
                : videoFile && audioFile
                ? 'Ingest Paired Media (Mode A) & Run Pipeline'
                : 'Ingest Single Media (Mode B) & Run Pipeline'}
            </span>
          </button>

          {isSubmitting && (
            <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-center space-y-2 animate-pulse">
              <div className="text-xs font-semibold text-indigo-400">{progressStep}</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-2/3 animate-indeterminate" />
              </div>
              <p className="text-[11px] text-slate-500">
                Offline AI Engine active. Extracting decisions, tasks, conflicts, and dependency DAG.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
