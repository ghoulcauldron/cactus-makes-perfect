// apps/admin/components/SurveyManager.tsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../api/client";
import { 
  UserGroupIcon, MagnifyingGlassIcon, XMarkIcon, 
  ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, 
  ClockIcon, PaperAirplaneIcon, FunnelIcon
} from '@heroicons/react/20/solid';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

const EVENTS = [
  { id: 'friday_meowwolf', label: 'MEOW' },
  { id: 'friday_dinner', label: 'DINR' },
  { id: 'saturday_railway', label: 'RAIL' },
  { id: 'sunday_brunch', label: 'BRCH' },
  { id: 'sunday_movie', label: 'MOVI' }
];

type RSVPFilter = "ALL_POTENTIALS" | "CONFIRMED_ONLY";
type ResponseFilter = "ALL" | "RESPONDED" | "AWAITING";

export default function SurveyManager() {
  const [data, setData] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [rsvpFilter, setRsvpFilter] = useState<RSVPFilter>("ALL_POTENTIALS");
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("ALL");

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

  // 1. Process "Sent" status into the data mapping
  const processedData = useMemo(() => {
    // Create a Set of guest IDs who have been sent a survey
    const sentIds = new Set(
      activity.filter(a => a.kind === 'survey_sent').map(a => a.guest_id)
    );

    return data.map(guest => ({
      ...guest,
      is_sent: sentIds.has(guest.id)
    }));
  }, [data, activity]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...processedData];

    // 1. Filter by RSVP Status (Confirmed vs All Potentials)
    if (rsvpFilter === "CONFIRMED_ONLY") {
      result = result.filter(r => r.rsvps?.status === 'yes');
    }

    // 2. Filter by Survey Response Status
    if (responseFilter === "RESPONDED") {
      result = result.filter(r => !!r.event_responses);
    } else if (responseFilter === "AWAITING") {
      result = result.filter(r => !r.event_responses);
    }

    // 3. Search Query
    const q = searchQuery.toLowerCase();
    if (q) {
      result = result.filter(r => 
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || 
        r.email.toLowerCase().includes(q)
      );
    }

    // 4. Sort: Responded First, then Sent/Idle, then Name
    return result.sort((a, b) => {
      const aRes = !!a.event_responses;
      const bRes = !!b.event_responses;
      if (aRes !== bRes) return aRes ? -1 : 1;
      
      const aSent = a.is_sent;
      const bSent = b.is_sent;
      if (aSent !== bSent) return aSent ? -1 : 1;

      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });
  }, [processedData, searchQuery, rsvpFilter, responseFilter]);

  // Sidebar Metrics Logic - Now reflects only 'yes' or 'maybe' guests
  const stats = useMemo(() => {
    const respondedIds = new Set(data.filter(r => r.event_responses).map(r => r.id));
    const activeGuestIds = new Set(data.map(g => g.id));
    const sentIds = new Set(
      activity
        .filter(a => a.kind === 'survey_sent' && activeGuestIds.has(a.guest_id))
        .map(a => a.guest_id)
    );
    
    return {
      total: data.length,
      responded: Array.from(respondedIds),
      pending: data.filter(r => !r.event_responses).map(r => r.id),
      sentButNoResp: Array.from(sentIds).filter(id => !respondedIds.has(id))
    };
  }, [data, activity]);
  

  if (loading) return <div className="p-12 text-[#45CC2D] font-mono animate-pulse uppercase text-center">Scanning Response Matrix...</div>;

  return (
    <div className="h-full w-full flex bg-black overflow-hidden font-mono text-[#45CC2D] relative">
      
      {/* MAIN MATRIX AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* HEADER CONTROLS */}
        <div className="shrink-0 p-4 sm:p-8 space-y-6 border-b border-[#45CC2D]/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tighter uppercase leading-none">Survey Matrix</h2>
              <p className="text-[10px] opacity-60 uppercase font-bold mt-2 tracking-widest">Event Coordination Grid</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* RSVP Dropdown */}
              <div className="relative w-44">
                <Listbox value={rsvpFilter} onChange={setRsvpFilter}>
                  <ListboxButton className="relative w-full border border-[#45CC2D]/40 bg-neutral-900/50 py-1.5 pl-3 pr-8 text-left text-[10px] font-bold uppercase hover:border-[#45CC2D] transition-colors">
                    <span className="block truncate">{rsvpFilter.replace('_', ' ')}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-[70] mt-1 w-full border border-[#45CC2D] bg-black py-1 shadow-2xl outline-none">
                    {(["ALL_POTENTIALS", "CONFIRMED_ONLY"] as RSVPFilter[]).map((f) => (
                      <ListboxOption key={f} value={f} className={({ active }) => `cursor-pointer select-none py-2 px-3 text-[10px] font-bold uppercase ${active ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]"}`}>
                        {f.replace('_', ' ')}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
              </div>

              {/* Response Toggle */}
              <div className="flex border border-[#45CC2D]/40 bg-neutral-900/50">
                {(["ALL", "RESPONDED", "AWAITING"] as ResponseFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setResponseFilter(f)}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase transition-all ${responseFilter === f ? 'bg-[#45CC2D] text-black' : 'text-[#45CC2D]/40 hover:text-[#45CC2D]'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE TABLE AREA */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-black">
              <tr className="border-b border-[#45CC2D]/30 shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                <th className="p-3 text-[10px] font-black uppercase tracking-widest bg-neutral-900/90">Guest Node</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90">Arrival</th>
                {EVENTS.map(ev => (
                  <th key={ev.id} className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90">
                    {ev.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((row) => (
                <tr key={row.id} className="border-b border-[#45CC2D]/10 hover:bg-[#45CC2D]/5 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold uppercase">{row.first_name} {row.last_name}</div>
                      {row.rsvps?.status === 'maybe' && (
                        <span className="text-[8px] border border-yellow-500/50 text-yellow-500 px-1 font-bold">MAYBE</span>
                      )}
                    </div>
                    <div className="text-[8px] opacity-40 truncate max-w-[150px]">{row.email}</div>
                  </td>

                  {/* NEW STATUS COLUMN */}
                  <td className="p-3 text-center border-l border-[#45CC2D]/10">
                    {row.event_responses ? (
                      <span className="text-[9px] bg-[#45CC2D] text-black px-1.5 py-0.5 font-bold uppercase tracking-tighter">DONE</span>
                    ) : row.is_sent ? (
                      <span className="text-[9px] border border-red-500 text-red-500 px-1.5 py-0.5 font-bold uppercase tracking-tighter animate-pulse">IDLE</span>
                    ) : (
                      <span className="text-[9px] border border-[#45CC2D]/30 text-[#45CC2D]/40 px-1.5 py-0.5 font-bold uppercase tracking-tighter">READY</span>
                    )}
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
                        <div className={`mx-auto w-4 h-4 border transition-all ${val ? 'bg-[#45CC2D] border-[#45CC2D] shadow-[0_0_8px_rgba(69,204,45,0.4)]' : 'border-[#45CC2D]/20 bg-black/40'}`}>
                          {val && <CheckCircleIcon className="w-full h-full text-black" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={EVENTS.length + 2} className="p-12 text-center text-[10px] uppercase opacity-30 italic">
                    No data matching current filters detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDEBAR Logic - Preserved but stays LG for metrics */}
      {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]" onClick={() => setIsSidebarOpen(false)} />}
      
      <div className={`fixed inset-y-0 right-0 z-[60] w-[85vw] sm:w-[320px] lg:static lg:w-80 lg:z-auto transform transition-transform duration-300 bg-black border-l border-[#45CC2D]/30 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-[#45CC2D]/30 bg-[#45CC2D] text-black flex items-center justify-between shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest">Survey Intelligence</span>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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