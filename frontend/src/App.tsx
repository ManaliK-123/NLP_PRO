import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MeetingCaptureStudio } from './components/MeetingCaptureStudio';
import { MeetingsList } from './components/MeetingsList';
import { MeetingWorkspace } from './components/MeetingWorkspace';
import { ActionCenter } from './components/ActionCenter';
import { DecisionsView } from './components/DecisionsView';
import { WorkflowView } from './components/WorkflowView';
import { ProjectMemoryView } from './components/ProjectMemoryView';
import { NLPEvaluationLab } from './components/NLPEvaluationLab';
import { SettingsView } from './components/SettingsView';
import { DashboardAnalytics, MeetingDetail } from './types';
import { fetchAnalytics, fetchMeetingDetail } from './api/client';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState<MeetingDetail | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // Load global dashboard analytics
  const refreshAnalytics = async () => {
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (e: any) {
      console.warn('Analytics loading error (backend starting):', e);
    }
  };

  useEffect(() => {
    refreshAnalytics();
  }, [currentTab]);

  // Load meeting workspace
  const openMeetingWorkspace = async (meetingId: number) => {
    setSelectedMeetingId(meetingId);
    try {
      setLoadingWorkspace(true);
      const detail = await fetchMeetingDetail(meetingId);
      setSelectedMeetingDetail(detail);
      setCurrentTab('workspace');
    } catch (e: any) {
      alert(`Could not load meeting #${meetingId}: ${e.message}`);
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleEvidenceJump = async (meetingId: number, timestamp: number) => {
    await openMeetingWorkspace(meetingId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'workspace') {
            setSelectedMeetingId(null);
          }
        }}
        activeProviderName={analytics?.active_ai_provider?.model_name}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View 1: Executive Dashboard */}
        {currentTab === 'dashboard' && (
          analytics ? (
            <Dashboard
              analytics={analytics}
              onSelectMeeting={openMeetingWorkspace}
              onNavigateTab={setCurrentTab}
            />
          ) : (
            <div className="p-12 text-center text-xs text-indigo-400">Loading system analytics...</div>
          )
        )}

        {/* View 2: Meeting Capture Studio */}
        {currentTab === 'new_meeting' && (
          <MeetingCaptureStudio
            onMeetingReady={(newId) => {
              openMeetingWorkspace(newId);
              refreshAnalytics();
            }}
          />
        )}

        {/* View 3: Analyzed Meetings */}
        {currentTab === 'meetings' && (
          <MeetingsList
            onSelectMeeting={openMeetingWorkspace}
            onNewMeeting={() => setCurrentTab('new_meeting')}
          />
        )}

        {/* View 4: Meeting Workspace (Video + Transcript + Evidence Split Screen) */}
        {currentTab === 'workspace' && (
          loadingWorkspace ? (
            <div className="p-12 text-center text-xs text-indigo-400">Loading meeting workspace...</div>
          ) : selectedMeetingDetail ? (
            <MeetingWorkspace
              meeting={selectedMeetingDetail}
              onRefreshMeeting={() => {
                if (selectedMeetingId) openMeetingWorkspace(selectedMeetingId);
                refreshAnalytics();
              }}
              onOpenFullWorkflow={() => setCurrentTab('workflows')}
            />
          ) : (
            <div className="p-8 text-center text-slate-400">No meeting selected.</div>
          )
        )}

        {/* View 5: Action Center */}
        {currentTab === 'tasks' && (
          <ActionCenter onSelectMeetingTask={handleEvidenceJump} />
        )}

        {/* View 6: Decisions View */}
        {currentTab === 'decisions' && (
          <DecisionsView onSelectMeetingDecision={handleEvidenceJump} />
        )}

        {/* View 7: Interactive Workflows (React Flow DAG) */}
        {currentTab === 'workflows' && (
          <WorkflowView
            meetingId={selectedMeetingId || (analytics?.recent_meetings[0]?.id || 1)}
            onNavigateToTimestamp={(ts) => {
              if (selectedMeetingId) openMeetingWorkspace(selectedMeetingId);
            }}
          />
        )}

        {/* View 8: Project Memory & Decision Drift */}
        {currentTab === 'projects' && (
          <ProjectMemoryView />
        )}

        {/* View 9: Analytics (Full Overview) */}
        {currentTab === 'analytics' && (
          analytics ? (
            <Dashboard
              analytics={analytics}
              onSelectMeeting={openMeetingWorkspace}
              onNavigateTab={setCurrentTab}
            />
          ) : (
            <div className="p-12 text-center text-xs text-indigo-400">Loading system analytics...</div>
          )
        )}

        {/* View 10: NLP Evaluation Lab */}
        {currentTab === 'evaluation' && (
          <NLPEvaluationLab />
        )}

        {/* View 11: Settings */}
        {currentTab === 'settings' && (
          <SettingsView
            activeProviderName={analytics?.active_ai_provider?.model_name}
            onResetDemoData={async () => {
              await refreshAnalytics();
              alert('Seeded demo data verified.');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-[11px] text-slate-500">
        MEETING → EXECUTION AI • Turn every conversation into action • Evidence-Backed NLP System
      </footer>
    </div>
  );
}

export default App;
