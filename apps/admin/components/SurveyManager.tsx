// apps/admin/components/SurveyManager.tsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../api/client";
import { 
  UserGroupIcon, MagnifyingGlassIcon, XMarkIcon, 
  ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, 
  ClockIcon, PaperAirplaneIcon, FunnelIcon, TicketIcon
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

  // --- CORE STATE DERIVATION ---
  const processedData = useMemo(() => {
    return data.map(guest => {
      const guestEmails = emails.filter(e => e.guest_id === guest.id);
      const guestActivity = activity.filter(a => a.guest_id === guest.id);
      
      const isSent = guestEmails.length > 0;
      const hasAuth = guestActivity.some(a => a.kind === "auth_success");
      const hasSubmitted = !!guest.event_responses;

      /** * NEW LOGIC DEFINITIONS:
       * 1. IDLE: Authenticated successfully but NO recorded responses.
       * 2. AWAITING: Sent the email but NO authentication success yet.
       * 3. READY: Positive RSVP but no email sent yet.
       */
      const isIdle = hasAuth && !hasSubmitted;
      const isAwaiting = isSent && !hasAuth && !hasSubmitted;

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
    if (q) {
      result = result.filter(r => 
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (a.has_submitted !== b.has_submitted) return a.has_submitted ? -1 : 1;
      if (a.is_idle !== b.is_idle) return a.is_idle ? -1 : 1;
      if (a.is_awaiting !== b.is_awaiting) return a.is_awaiting ? -1 : 1;
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });
  }, [processedData, searchQuery, rsvpFilter, responseFilter]);

  const stats = useMemo(() => {
    return {
      totalCohort: processedData.length,
      confirmedYes: processedData.filter(r => r.rsvps?.status === 'yes').length,
      responded: processedData.filter(r => r.has_submitted).length,
      awaiting: processedData.filter(r => r.is_awaiting).length,
      idle: processedData.filter(r => r.is_idle).length
    };
  }, [processedData]);

  if (loading) return <div className="p-12 text-[#45CC2D] font-mono animate-pulse uppercase text-center">Scanning Response Matrix...</div>;

  return (
    <div className="h-full w-full flex bg-black overflow-hidden font-mono text-[#45CC2D] relative">
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* HEADER CONTROLS (Remains same) */}

        <div className="flex-1 overflow-auto scrollbar-hide">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-black">
              <tr className="border-b border-[#45CC2D]/30">
                <th className="p-3 text-[10px] font-black uppercase tracking-widest bg-neutral-900/90">Guest Node</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90 w-24">Telemetry</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90">Arrival</th>
                {EVENTS.map(ev => (
                  <th key={ev.id} className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90">{ev.label}</th>
                ))}
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
                    <div className="flex justify-center gap-1">
                      {row.has_submitted ? (
                        <span className="text-[8px] bg-[#45CC2D] text-black px-1 font-bold">DONE</span>
                      ) : row.is_idle ? (
                        <span className="text-[8px] border border-red-500 text-red-500 px-1 font-bold animate-pulse">IDLE</span>
                      ) : row.is_awaiting ? (
                        <div className="flex items-center gap-1">
                           <ClockIcon className="h-3 w-3 text-yellow-500/50" />
                           <span className="text-[8px] text-yellow-500/50 font-bold">WAIT</span>
                        </div>
                      ) : (
                        <span className="text-[8px] opacity-20">READY</span>
                      )}
                    </div>
                  </td>
                  {/* ... (Arrival and Event Checkbox columns remain same) */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDEBAR METRICS - Corrected for strictly 'Yes' guests */}
      <div className="hidden lg:flex w-80 bg-black border-l border-[#45CC2D]/30 flex-col shrink-0">
        <div className="p-4 border-b border-[#45CC2D]/30 bg-[#45CC2D] text-black flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest">Survey Intelligence</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-black">
            <span className="text-[10px] font-bold uppercase">Total Cohort</span>
            <span className="text-sm font-black">{stats.totalCohort}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-[#45CC2D]/5">
            <span className="text-[10px] font-bold uppercase">Confirmed (YES)</span>
            <span className="text-sm font-black">{stats.confirmedYes}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-[#45CC2D]/30 bg-black">
            <span className="text-[10px] font-bold uppercase text-[#45CC2D]/60">Responded</span>
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