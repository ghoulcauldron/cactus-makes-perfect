// apps/admin/components/SurveyManager.tsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../api/client";
import { 
  UserGroupIcon, MagnifyingGlassIcon, XMarkIcon, 
  ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, 
  ClockIcon, PaperAirplaneIcon 
} from '@heroicons/react/20/solid';

const EVENTS = [
  { id: 'friday_meowwolf', label: 'MEOW' },
  { id: 'friday_dinner', label: 'DINR' },
  { id: 'saturday_railway', label: 'RAIL' },
  { id: 'sunday_brunch', label: 'BRCH' },
  { id: 'sunday_movie', label: 'MOVI' }
];

export default function SurveyManager() {
  const [data, setData] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function refreshData() {
    try {
      const res = await apiFetch("/admin/surveys");
      setData(res.responses || []);
      setActivity(res.activity || []);
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshData(); }, []);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.filter(r => 
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || 
      r.email.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  // Sidebar Metrics Logic
  const stats = useMemo(() => {
    const respondedIds = new Set(data.filter(r => r.event_responses).map(r => r.id));
    const sentIds = new Set(activity.filter(a => a.kind === 'survey_sent').map(a => a.guest_id));
    
    return {
      total: data.length,
      responded: data.filter(r => r.event_responses).map(r => r.id),
      pending: data.filter(r => !r.event_responses).map(r => r.id),
      sentButNoResp: Array.from(sentIds).filter(id => !respondedIds.has(id))
    };
  }, [data, activity]);

  if (loading) return <div className="p-12 text-[#45CC2D] font-mono animate-pulse uppercase text-center">Scanning Response Matrix...</div>;

  return (
    <div className="h-full w-full flex bg-black overflow-hidden font-mono text-[#45CC2D] relative">
      
      {/* MAIN MATRIX AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 space-y-6 scrollbar-hide">
        <div className="flex justify-between items-center border-b border-[#45CC2D]/30 pb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tighter uppercase leading-none">Survey Matrix</h2>
            <p className="text-[10px] opacity-60 uppercase font-bold mt-2 tracking-widest">Event Coordination Grid</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#45CC2D]/20 bg-neutral-900/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#45CC2D]/30 bg-[#45CC2D]/5">
                <th className="p-3 text-[10px] font-black uppercase tracking-widest">Guest Node</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10">Arrival</th>
                {EVENTS.map(ev => (
                  <th key={ev.id} className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10">
                    {ev.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id} className="border-b border-[#45CC2D]/10 hover:bg-[#45CC2D]/5 transition-colors">
                  <td className="p-3">
                    <div className="text-xs font-bold uppercase">{row.first_name} {row.last_name}</div>
                    <div className="text-[8px] opacity-40 truncate max-w-[120px]">{row.email}</div>
                  </td>
                  <td className="p-3 text-center border-l border-[#45CC2D]/10">
                    <span className="text-[10px] font-bold uppercase opacity-80">
                      {row.event_responses?.arrival_day?.slice(0,3) || '---'}
                    </span>
                  </td>
                  {EVENTS.map(ev => {
                    const val = row.event_responses?.[ev.id];
                    return (
                      <td key={ev.id} className="p-3 text-center border-l border-[#45CC2D]/10">
                        <div className={`mx-auto w-4 h-4 border ${val ? 'bg-[#45CC2D] border-[#45CC2D]' : 'border-[#45CC2D]/20 bg-black/40'}`}>
                          {val && <CheckCircleIcon className="w-full h-full text-black" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESPONSIVE SIDEBAR */}
      {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]" onClick={() => setIsSidebarOpen(false)} />}
      
      <div className={`fixed inset-y-0 right-0 z-[60] w-[85vw] sm:w-[320px] lg:static lg:w-80 lg:z-auto transform transition-transform duration-300 bg-black border-l border-[#45CC2D]/30 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-[#45CC2D]/30 bg-[#45CC2D] text-black flex items-center justify-between shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest">Survey Intelligence</span>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <div className="p-2 bg-black/40 border-b border-[#45CC2D]/20 shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#45CC2D]/40" />
            <input 
              type="text" 
              placeholder="SEARCH NODE..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-neutral-900/50 border border-[#45CC2D]/30 pl-8 pr-2 py-2 text-[10px] text-[#45CC2D] outline-none uppercase transition-all" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* STATS BLOCKS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-[#45CC2D]/5">
              <span className="text-[10px] font-bold uppercase">Total Nodes</span>
              <span className="text-sm font-black">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-black">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">Responded</span>
              </div>
              <span className="text-sm font-black">{stats.responded.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-black">
              <div className="flex items-center gap-2 text-yellow-500">
                <ClockIcon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">Awaiting</span>
              </div>
              <span className="text-sm font-black">{stats.pending.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-red-500/30 bg-black">
              <div className="flex items-center gap-2 text-red-500">
                <PaperAirplaneIcon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">Sent/Idle</span>
              </div>
              <span className="text-sm font-black">{stats.sentButNoResp.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FAB */}
      <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-[40] bg-[#45CC2D] text-black p-4 rounded-full shadow-[0_0_20px_rgba(69,204,45,0.4)]">
        <UserGroupIcon className="h-6 w-6" />
      </button>
    </div>
  );
}