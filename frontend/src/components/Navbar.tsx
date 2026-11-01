import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  FolderKanban, 
  CheckSquare, 
  Scale, 
  GitMerge, 
  BarChart3, 
  FlaskConical, 
  Settings as SettingsIcon,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeProviderName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, activeProviderName }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_meeting', label: 'Capture Studio', icon: Plus, highlight: true },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'tasks', label: 'Action Items', icon: CheckSquare },
    { id: 'decisions', label: 'Decisions', icon: Scale },
    { id: 'workflows', label: 'Workflows', icon: GitMerge },
    { id: 'projects', label: 'Project Memory', icon: FolderKanban },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'evaluation', label: 'NLP Lab', icon: FlaskConical },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GitMerge className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  MEETING <span className="text-indigo-400">→</span> EXECUTION
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide">Turn every conversation into action.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    item.highlight 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : isActive
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700/60 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mode & Engine Chip */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 text-[11px] font-mono">
                {activeProviderName || 'Local NLP Engine (Zero-Friction Offline)'}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentTab('new_meeting')}
              className="md:hidden p-2 rounded-lg bg-indigo-600 text-white"
              title="New Meeting"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
