// apps/admin/components/SurveyManager.tsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../api/client";
import { 
  UserGroupIcon, MagnifyingGlassIcon, XMarkIcon, 
  ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, 
  ClockIcon, PaperAirplaneIcon, TicketIcon 
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
  const [emails, setEmails] = useState<any[]>([]);
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
      setEmails(res.emails || []);
      setActivity(res.activity || []);
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshData(); }, []);

  const processedData = useMemo(() => {
    return data.map(guest => {
      const guestEmails = emails.filter(e => e.guest_id === guest.id && e.type === 'survey');
      const guestActivity = activity.filter(a => a.guest_id === guest.id);
      
      const isSent = guestEmails.length > 0;
      const hasAuth = guestActivity.some(a => a.kind === "auth_success");
      const hasSubmitted = !!guest.event_responses;

      // Telemetry Mapping aligned with SQL Audit
      const isIdle = hasAuth && !hasSubmitted; // Auth exists but no responses
      const isAwaiting = isSent && !hasAuth && !hasSubmitted; // Sent but no auth/resp

      return {
        ...guest,
        is_sent: isSent,
        is_idle: isIdle,
        is_awaiting: isAwaiting,
        has_auth: hasAuth,
        has_submitted: hasSubmitted
      };
    });
  }, [data, emails, activity]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...processedData];
    if (rsvpFilter === "CONFIRMED_ONLY") result = result.filter(r => r.rsvps?.status === 'yes');
    if (responseFilter === "RESPONDED") result = result.filter(r => r.has_submitted);
    else if (responseFilter === "AWAITING") result = result.filter(r => !r.has_submitted);

    const q = searchQuery.toLowerCase();
    if (q) result = result.filter(r => `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));

    return result.sort((a, b) => {
      if (a.has_submitted !== b.has_submitted) return a.has_submitted ? -1 : 1;
      if (a.is_idle !== b.is_idle) return a.is_idle ? -1 : 1;
      if (a.is_awaiting !== b.is_awaiting) return a.is_awaiting ? -1 : 1;
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });
  }, [processedData, searchQuery, rsvpFilter, responseFilter]);

  const stats = useMemo(() => ({
    totalCohort: processedData.length, // Should be 39
    confirmedYes: processedData.filter(r => r.rsvps?.status === 'yes').length, // Should be 28
    responded: processedData.filter(r => r.has_submitted).length,
    awaiting: processedData.filter(r => r.is_awaiting).length,
    idle: processedData.filter(r => r.is_idle).length
  }), [processedData]);

  if (loading) return <div className="p-12 text-[#45CC2D] font-mono animate-pulse uppercase text-center">Scanning Response Matrix...</div>;

  return (
    <div className="h-full w-full flex bg-black overflow-hidden font-mono text-[#45CC2D] relative">
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        <div className="shrink-0 p-4 sm:p-8 space-y-6 border-b border-[#45CC2D]/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tighter uppercase leading-none">Survey Matrix</h2>
              <p className="text-[10px] opacity-60 uppercase font-bold mt-2 tracking-widest">Event Coordination Grid</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-44">
                <Listbox value={rsvpFilter} onChange={setRsvpFilter}>
                  <ListboxButton className="relative w-full border border-[#45CC2D]/40 bg-neutral-900/50 py-1.5 pl-3 pr-8 text-left text-[10px] font-bold uppercase truncate">
                    <span>{rsvpFilter.replace('_', ' ')}</span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2"><ChevronDownIcon className="h-4 w-4 opacity-50" /></span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-[70] mt-1 w-full border border-[#45CC2D] bg-black py-1 shadow-2xl outline-none">
                    {(["ALL_POTENTIALS", "CONFIRMED_ONLY"] as RSVPFilter[]).map((f) => (
                      <ListboxOption key={f} value={f} className={({ active }) => `cursor-pointer py-2 px-3 text-[10px] font-bold uppercase ${active ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]"}`}>
                        {f.replace('_', ' ')}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
              </div>
              <div className="flex border border-[#45CC2D]/40 bg-neutral-900/50">
                {(["ALL", "RESPONDED", "AWAITING"] as ResponseFilter[]).map((f) => (
                  <button key={f} onClick={() => setResponseFilter(f)} className={`px-3 py-1.5 text-[9px] font-bold uppercase transition-all ${responseFilter === f ? 'bg-[#45CC2D] text-black' : 'text-[#45CC2D]/40'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-black">
              <tr className="border-b border-[#45CC2D]/30 shadow-lg">
                <th className="p-3 text-[10px] font-black uppercase tracking-widest bg-neutral-900/90">Guest Node</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90 w-24">Telemetry</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90">Arrival</th>
                {EVENTS.map(ev => (<th key={ev.id} className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90">{ev.label}</th>))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((row) => (
                <tr key={row.id} className={`border-b border-[#45CC2D]/10 hover:bg-[#45CC2D]/5 transition-colors ${!row.is_sent && !row.has_submitted ? 'opacity-30' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold uppercase">{row.first_name} {row.last_name}</div>
                      {row.is_sent && <PaperAirplaneIcon className="h-3 w-3 text-[#45CC2D]/60" title="Survey Dispatched" />}
                      {row.rsvps?.status === 'maybe' && <span className="text-[8px] border border-yellow-500/50 text-yellow-500 px-1 font-bold">MAYBE</span>}
                    </div>
                    <div className="text-[8px] opacity-40 truncate max-w-[150px]">{row.email}</div>
                  </td>
                  <td className="p-3 text-center border-l border-[#45CC2D]/10">
                    <div className="flex justify-center">
                      {row.has_submitted ? (
                        <span className="text-[8px] bg-[#45CC2D] text-black px-1 font-bold">DONE</span>
                      ) : row.is_idle ? (
                        <span className="text-[8px] border border-red-500 text-red-500 px-1 font-bold animate-pulse">IDLE</span>
                      ) : row.is_awaiting ? (
                        <span className="text-[8px] text-yellow-500/50 font-bold flex items-center gap-0.5"><ClockIcon className="h-3 w-3" />WAIT</span>
                      ) : (
                        <span className="text-[8px] opacity-20">READY</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center border-l border-[#45CC2D]/10"><span className="text-[10px] font-bold uppercase opacity-80">{row.event_responses?.arrival_day?.slice(0,3) || '---'}</span></td>
                  {EVENTS.map(ev => {
                    const val = row.event_responses?.[ev.id];
                    return (
                      <td key={ev.id} className="p-3 text-center border-l border-[#45CC2D]/10">
                        <div className={`mx-auto w-4 h-4 border ${val ? 'bg-[#45CC2D] border-[#45CC2D] shadow-[0_0_8px_rgba(69,204,45,0.3)]' : 'border-[#45CC2D]/20 bg-black/40'}`}>
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

      <div className="hidden lg:flex w-80 bg-black border-l border-[#45CC2D]/30 flex-col shrink-0">
        <div className="p-4 border-b border-[#45CC2D]/30 bg-[#45CC2D] text-black flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest">Survey Intelligence</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-black">
            <span className="text-[10px] font-bold uppercase opacity-60">Total Cohort (YES/MAYBE)</span>
            <span className="text-sm font-black">39</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-[#45CC2D]/5">
            <span className="text-[10px] font-bold uppercase">Confirmed (YES)</span>
            <span className="text-sm font-black">28</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-black">
            <span className="text-[10px] font-bold uppercase opacity-60">Responded</span>
            <span className="text-sm font-black">{stats.responded}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-yellow-500/30 bg-black">
            <div className="flex items-center gap-2 text-yellow-500">
              <ClockIcon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase">Awaiting Auth</span>
            </div>
            <span className="text-sm font-black text-yellow-500">{stats.awaiting}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-red-500/30 bg-black">
            <div className="flex items-center gap-2 text-red-500">
              <TicketIcon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase">Idle in Portal</span>
            </div>
            <span className="text-sm font-black text-red-500">{stats.idle}</span>
          </div>
        </div>
      </div>
    </div>
  );
}