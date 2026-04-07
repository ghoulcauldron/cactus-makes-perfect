// apps/admin/components/SurveyManager.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { apiFetch, overrideSurveyResponse } from "../api/client";
import { 
  UserGroupIcon, MagnifyingGlassIcon, XMarkIcon, 
  ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, 
  ClockIcon, PaperAirplaneIcon, TicketIcon,
  PencilSquareIcon, CheckIcon, ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/20/solid';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const EVENTS: { id: string; label: string }[] = [
  { id: 'friday_meowwolf', label: 'MEOW' },
  { id: 'friday_dinner',   label: 'DINR' },
  { id: 'saturday_railway', label: 'RAIL' },
  { id: 'sunday_brunch',   label: 'BRCH' },
  { id: 'sunday_movie',    label: 'MOVI' },
];

const ARRIVAL_OPTIONS = ['thursday', 'friday', 'saturday', 'sunday'] as const;
type ArrivalDay = typeof ARRIVAL_OPTIONS[number];

type RSVPFilter     = "ALL_POTENTIALS" | "CONFIRMED_ONLY";
type ResponseFilter = "ALL" | "RESPONDED" | "AWAITING";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface EventResponseRow {
  id: string;
  guest_id: string;
  arrival_day: ArrivalDay | null;
  friday_meowwolf:  boolean | null;
  friday_dinner:    boolean | null;
  saturday_railway: boolean | null;
  sunday_brunch:    boolean | null;
  sunday_movie:     boolean | null;
  admin_edited:     boolean | null;
  submitted_at:     string | null;
  updated_at:       string | null;
}

// The shape each row has after processedData enrichment
interface ProcessedGuest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  rsvps?: { status: string };
  event_responses: EventResponseRow | null;
  is_sent: boolean;
  is_idle: boolean;
  is_awaiting: boolean;
  has_submitted: boolean;
  last_sent_at: string | null;
}

// A pending edit: keyed by guest_id, holds draft values
interface DraftEdit {
  arrival_day: ArrivalDay | null;
  friday_meowwolf:  boolean;
  friday_dinner:    boolean;
  saturday_railway: boolean;
  sunday_brunch:    boolean;
  sunday_movie:     boolean;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function blankDraft(): DraftEdit {
  return {
    arrival_day: null,
    friday_meowwolf:  false,
    friday_dinner:    false,
    saturday_railway: false,
    sunday_brunch:    false,
    sunday_movie:     false,
  };
}

function responseToDraft(er: EventResponseRow | null): DraftEdit {
  if (!er) return blankDraft();
  return {
    arrival_day:      (er.arrival_day as ArrivalDay | null) ?? null,
    friday_meowwolf:  er.friday_meowwolf  ?? false,
    friday_dinner:    er.friday_dinner    ?? false,
    saturday_railway: er.saturday_railway ?? false,
    sunday_brunch:    er.sunday_brunch    ?? false,
    sunday_movie:     er.sunday_movie     ?? false,
  };
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

/** A single toggle checkbox cell used while editing */
function EditableCheckbox({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`mx-auto w-4 h-4 border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#45CC2D]/60
        ${value
          ? 'bg-[#45CC2D] border-[#45CC2D] shadow-[0_0_8px_rgba(69,204,45,0.5)]'
          : 'border-[#45CC2D]/40 bg-black/40 hover:border-[#45CC2D]/80'
        }`}
    >
      {value && <CheckCircleIcon className="w-full h-full text-black" />}
    </button>
  );
}

/** Read-only checkbox cell */
function ReadonlyCheckbox({ value }: { value: boolean | null }) {
  return (
    <div className={`mx-auto w-4 h-4 border ${value
      ? 'bg-[#45CC2D] border-[#45CC2D] shadow-[0_0_8px_rgba(69,204,45,0.3)]'
      : 'border-[#45CC2D]/20 bg-black/40'}`}
    >
      {value && <CheckCircleIcon className="w-full h-full text-black" />}
    </div>
  );
}

/** Compact arrival day selector (shown in edit mode) */
function ArrivalSelect({
  value,
  onChange,
}: {
  value: ArrivalDay | null;
  onChange: (v: ArrivalDay | null) => void;
}) {
  return (
    <Listbox value={value ?? ''} onChange={(v) => onChange(v ? (v as ArrivalDay) : null)}>
      <div className="relative">
        <ListboxButton className="w-16 border border-[#45CC2D]/50 bg-black py-0.5 px-1 text-[9px] font-bold uppercase text-[#45CC2D] text-center flex items-center justify-between gap-0.5">
          <span className="truncate">{value ? value.slice(0,3).toUpperCase() : '---'}</span>
          <ChevronDownIcon className="h-2.5 w-2.5 shrink-0 opacity-50" />
        </ListboxButton>
        <ListboxOptions className="absolute z-[80] left-1/2 -translate-x-1/2 mt-0.5 w-24 border border-[#45CC2D] bg-black py-1 shadow-2xl outline-none">
          <ListboxOption
            value=""
            className={({ active }) => `cursor-pointer py-1 px-2 text-[9px] font-bold uppercase ${active ? 'bg-[#45CC2D] text-black' : 'text-[#45CC2D]/40'}`}
          >
            ---
          </ListboxOption>
          {ARRIVAL_OPTIONS.map(opt => (
            <ListboxOption
              key={opt}
              value={opt}
              className={({ active }) => `cursor-pointer py-1 px-2 text-[9px] font-bold uppercase ${active ? 'bg-[#45CC2D] text-black' : 'text-[#45CC2D]'}`}
            >
              {opt.slice(0,3).toUpperCase()}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function SurveyManager() {
  const [data,     setData]     = useState<any[]>([]);
  const [emails,   setEmails]   = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [searchQuery,     setSearchQuery]     = useState("");
  const [rsvpFilter,      setRsvpFilter]      = useState<RSVPFilter>("ALL_POTENTIALS");
  const [responseFilter,  setResponseFilter]  = useState<ResponseFilter>("ALL");

  // ---------------------------------------------------------------------------
  // EDIT STATE
  // Map of guestId -> DraftEdit. Only guests with an entry here are "dirty".
  // ---------------------------------------------------------------------------
  const [drafts,   setDrafts]   = useState<Record<string, DraftEdit>>({});
  const [saving,   setSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = Object.keys(drafts).length > 0;

  // ---------------------------------------------------------------------------
  // DATA FETCH
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // PROCESSED DATA
  // ---------------------------------------------------------------------------
  const processedData = useMemo<ProcessedGuest[]>(() => {
    return data.map(guest => {
      const lastSurveyEmail = emails
        .filter(e => e.guest_id === guest.id)
        .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];

      const lastAuth = activity
        .filter((a: any) => a.guest_id === guest.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const isSent       = !!lastSurveyEmail;
      const hasSubmitted = !!guest.event_responses;
      const hasBridgedSurvey = isSent && lastAuth &&
        new Date(lastAuth.created_at) > new Date(lastSurveyEmail.sent_at);

      const isIdle     = hasBridgedSurvey && !hasSubmitted;
      const isAwaiting = isSent && !hasBridgedSurvey && !hasSubmitted;

      return {
        ...guest,
        is_sent:      isSent,
        is_idle:      isIdle,
        is_awaiting:  isAwaiting,
        has_submitted: hasSubmitted,
        last_sent_at: lastSurveyEmail?.sent_at ?? null,
      } as ProcessedGuest;
    });
  }, [data, emails, activity]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...processedData];
    if (rsvpFilter === "CONFIRMED_ONLY") result = result.filter(r => r.rsvps?.status === 'yes');
    if (responseFilter === "RESPONDED")  result = result.filter(r => r.has_submitted);
    else if (responseFilter === "AWAITING") result = result.filter(r => !r.has_submitted);

    const q = searchQuery.toLowerCase();
    if (q) result = result.filter(r =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );

    return result.sort((a, b) => {
      if (a.has_submitted !== b.has_submitted) return a.has_submitted ? -1 : 1;
      if (a.is_idle !== b.is_idle) return a.is_idle ? -1 : 1;
      if (a.is_awaiting !== b.is_awaiting) return a.is_awaiting ? -1 : 1;
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });
  }, [processedData, searchQuery, rsvpFilter, responseFilter]);

  // ---------------------------------------------------------------------------
  // TALLIES (react to drafts too so header stays live)
  // ---------------------------------------------------------------------------
  const tallies = useMemo(() => {
    const arrivalCounts: Record<string, number> = {};
    const eventCounts: Record<string, number> = {};
    EVENTS.forEach(ev => eventCounts[ev.id] = 0);

    processedData.forEach(guest => {
      // Use draft if pending, else committed data
      const draft = drafts[guest.id];
      const day   = draft ? draft.arrival_day : guest.event_responses?.arrival_day;
      if (day) arrivalCounts[day] = (arrivalCounts[day] || 0) + 1;

      EVENTS.forEach(ev => {
        const val = draft
          ? draft[ev.id as keyof DraftEdit] as boolean
          : guest.event_responses?.[ev.id as keyof EventResponseRow] === true;
        if (val) eventCounts[ev.id]++;
      });
    });

    return {
      arrivals: Object.entries(arrivalCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => ARRIVAL_OPTIONS.indexOf(a[0] as ArrivalDay) - ARRIVAL_OPTIONS.indexOf(b[0] as ArrivalDay)),
      events: EVENTS.map(ev => ({ label: ev.label, count: eventCounts[ev.id] })),
    };
  }, [processedData, drafts]);

  const stats = useMemo(() => ({
    totalCohort:  processedData.length,
    confirmedYes: processedData.filter(r => r.rsvps?.status === 'yes').length,
    responded:    processedData.filter(r => r.has_submitted).length,
    awaiting:     processedData.filter(r => r.is_awaiting).length,
    idle:         processedData.filter(r => r.is_idle).length,
  }), [processedData]);

  // ---------------------------------------------------------------------------
  // EDIT HANDLERS
  // ---------------------------------------------------------------------------

  /** Start editing a guest row (if not already drafted) */
  const startEdit = useCallback((guest: ProcessedGuest) => {
    setDrafts(prev => {
      if (prev[guest.id]) return prev; // already dirty, don't reset
      return { ...prev, [guest.id]: responseToDraft(guest.event_responses) };
    });
    setSaveError(null);
  }, []);

  /** Toggle a boolean event field in a draft */
  const toggleEvent = useCallback((guestId: string, eventId: string) => {
    setDrafts(prev => {
      const cur = prev[guestId];
      if (!cur) return prev;
      return {
        ...prev,
        [guestId]: { ...cur, [eventId]: !cur[eventId as keyof DraftEdit] },
      };
    });
  }, []);

  /** Update arrival day in a draft */
  const setArrival = useCallback((guestId: string, day: ArrivalDay | null) => {
    setDrafts(prev => {
      const cur = prev[guestId];
      if (!cur) return prev;
      return { ...prev, [guestId]: { ...cur, arrival_day: day } };
    });
  }, []);

  /** Revert all pending edits */
  const handleCancel = useCallback(() => {
    setDrafts({});
    setSaveError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // SAVE — bulk upsert all dirty rows
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    setSaving(true);
    setSaveError(null);

    const guestIds = Object.keys(drafts);

    try {
      // Fire one PATCH per dirty guest (backend upserts event_responses + logs activity)
      await Promise.all(
        guestIds.map(guestId => overrideSurveyResponse(guestId, drafts[guestId]))
      );

      // Refresh data and clear drafts
      await refreshData();
      setDrafts({});
    } catch (err: any) {
      console.error("Survey override failed", err);
      setSaveError(err?.data?.error || "SAVE FAILED — CHECK CONSOLE");
    } finally {
      setSaving(false);
    }
  }, [drafts, isDirty]);

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------

  function renderTelemetryBadge(row: ProcessedGuest) {
    const isEdited = row.event_responses?.admin_edited;
    return (
      <div className="flex flex-col items-center gap-1">
        {row.has_submitted ? (
          <span className="text-[8px] bg-[#45CC2D] text-black px-1 font-bold">DONE</span>
        ) : row.is_idle ? (
          <span className="text-[8px] border border-red-500 text-red-500 px-1 font-bold animate-pulse">IDLE</span>
        ) : row.is_awaiting ? (
          <span className="text-[8px] text-yellow-500/50 font-bold flex items-center gap-0.5">
            <ClockIcon className="h-3 w-3" />WAIT
          </span>
        ) : (
          <span className="text-[8px] opacity-20">READY</span>
        )}
        {isEdited && (
          <span className="text-[7px] border border-purple-400/60 text-purple-400 px-1 font-bold tracking-widest">
            EDITED
          </span>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (loading) return (
    <div className="p-12 text-[#45CC2D] font-mono animate-pulse uppercase text-center">
      Scanning Response Matrix...
    </div>
  );

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="h-full w-full flex bg-black overflow-hidden font-mono text-[#45CC2D] relative">
      <div className="flex-1 flex flex-col min-w-0 bg-black">

        {/* ----------------------------------------------------------------- */}
        {/* HEADER                                                             */}
        {/* ----------------------------------------------------------------- */}
        <div className="shrink-0 p-4 sm:p-8 space-y-6 border-b border-[#45CC2D]/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tighter uppercase leading-none">Survey Matrix</h2>
              <p className="text-[10px] opacity-60 uppercase font-bold mt-2 tracking-widest">Event Coordination Grid</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-44">
                <Listbox value={rsvpFilter} onChange={setRsvpFilter}>
                  <ListboxButton className="relative w-full border border-[#45CC2D]/40 bg-neutral-900/50 py-1.5 pl-3 pr-8 text-left text-[10px] font-bold uppercase truncate">
                    <span>{rsvpFilter.replace('_', ' ')}</span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-[70] mt-1 w-full border border-[#45CC2D] bg-black py-1 shadow-2xl outline-none">
                    {(["ALL_POTENTIALS", "CONFIRMED_ONLY"] as RSVPFilter[]).map(f => (
                      <ListboxOption key={f} value={f} className={({ active }) =>
                        `cursor-pointer py-2 px-3 text-[10px] font-bold uppercase ${active ? 'bg-[#45CC2D] text-black' : 'text-[#45CC2D]'}`
                      }>
                        {f.replace('_', ' ')}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
              </div>

              <div className="flex border border-[#45CC2D]/40 bg-neutral-900/50">
                {(["ALL", "RESPONDED", "AWAITING"] as ResponseFilter[]).map(f => (
                  <button key={f} onClick={() => setResponseFilter(f)}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase transition-all ${responseFilter === f ? 'bg-[#45CC2D] text-black' : 'text-[#45CC2D]/40'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LOGISTICS METRICS RIBBON */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-[#45CC2D]/10">
            <div className="flex gap-4">
              {tallies.arrivals.map(([day, count]) => (
                <div key={day} className="flex flex-col">
                  <span className="text-[8px] opacity-40 uppercase tracking-widest leading-none mb-1">{day.slice(0,3)}</span>
                  <span className="text-sm font-black tracking-tighter">{count}</span>
                </div>
              ))}
            </div>
            <div className="hidden sm:block w-px h-8 bg-[#45CC2D]/20" />
            <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-1">
              {tallies.events.map(ev => (
                <div key={ev.label} className="flex flex-col min-w-[32px]">
                  <span className="text-[8px] opacity-40 uppercase tracking-widest leading-none mb-1">{ev.label}</span>
                  <span className={`text-sm font-black tracking-tighter ${ev.count === 0 ? 'opacity-20' : ''}`}>
                    {ev.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* FLOATING SAVE / CANCEL BAR (appears when drafts exist)            */}
        {/* ----------------------------------------------------------------- */}
        {isDirty && (
          <div className="shrink-0 px-4 sm:px-8 py-2 border-b border-purple-500/40 bg-purple-900/20 flex items-center justify-between gap-4 z-30">
            <div className="flex items-center gap-2 text-purple-300">
              <PencilSquareIcon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {Object.keys(drafts).length} row{Object.keys(drafts).length !== 1 ? 's' : ''} pending override
              </span>
              {saveError && (
                <span className="text-[9px] text-red-400 border border-red-500/40 px-1">{saveError}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1 text-[9px] font-bold uppercase border border-[#45CC2D]/30 text-[#45CC2D]/60 hover:text-[#45CC2D] hover:border-[#45CC2D]/60 transition-all disabled:opacity-30"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1 text-[9px] font-bold uppercase bg-purple-500 text-white hover:bg-purple-400 transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {saving
                  ? <><ArrowPathIcon className="h-3 w-3 animate-spin" />SAVING...</>
                  : <><CheckIcon className="h-3 w-3" />SAVE OVERRIDES</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TABLE                                                              */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-black">
              <tr className="border-b border-[#45CC2D]/30 shadow-lg">
                <th className="p-3 text-[10px] font-black uppercase tracking-widest bg-neutral-900/90">Guest Node</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90 w-24">Telemetry</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90 w-20">Arrival</th>
                {EVENTS.map(ev => (
                  <th key={ev.id} className="p-3 text-[10px] font-black uppercase tracking-widest text-center border-l border-[#45CC2D]/10 bg-neutral-900/90">
                    {ev.label}
                  </th>
                ))}
                {/* Edit trigger column */}
                <th className="p-3 w-8 bg-neutral-900/90" />
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map(row => {
                const draft    = drafts[row.id];
                const isEditing = !!draft;
                const isDirtyRow = isEditing;

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#45CC2D]/10 transition-colors
                      ${isDirtyRow
                        ? 'bg-purple-900/10 border-purple-500/20'
                        : !row.is_sent && !row.has_submitted
                          ? 'opacity-30 hover:bg-[#45CC2D]/5'
                          : 'hover:bg-[#45CC2D]/5'
                      }`}
                  >
                    {/* NAME */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold uppercase">{row.first_name} {row.last_name}</div>
                        {row.is_sent && <PaperAirplaneIcon className="h-3 w-3 text-[#45CC2D]/60" title="Survey Dispatched" />}
                        {row.rsvps?.status === 'maybe' && (
                          <span className="text-[8px] border border-yellow-500/50 text-yellow-500 px-1 font-bold">MAYBE</span>
                        )}
                        {isDirtyRow && (
                          <span className="text-[7px] border border-purple-400/50 text-purple-400 px-1 font-bold">PENDING</span>
                        )}
                      </div>
                      <div className="text-[8px] opacity-40 truncate max-w-[150px]">{row.email}</div>
                    </td>

                    {/* TELEMETRY */}
                    <td className="p-3 text-center border-l border-[#45CC2D]/10">
                      {renderTelemetryBadge(row)}
                    </td>

                    {/* ARRIVAL */}
                    <td className="p-3 text-center border-l border-[#45CC2D]/10">
                      {isEditing ? (
                        <div className="flex justify-center">
                          <ArrivalSelect
                            value={draft.arrival_day}
                            onChange={day => setArrival(row.id, day)}
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold uppercase opacity-80">
                          {row.event_responses?.arrival_day?.slice(0,3) || '---'}
                        </span>
                      )}
                    </td>

                    {/* EVENT CHECKBOXES */}
                    {EVENTS.map(ev => {
                      const committed = row.event_responses?.[ev.id as keyof EventResponseRow] as boolean | null;
                      const draftVal  = draft?.[ev.id as keyof DraftEdit] as boolean | undefined;

                      return (
                        <td key={ev.id} className="p-3 text-center border-l border-[#45CC2D]/10">
                          <div className="flex justify-center">
                            {isEditing ? (
                              <EditableCheckbox
                                value={draftVal ?? false}
                                onChange={() => toggleEvent(row.id, ev.id)}
                              />
                            ) : (
                              <ReadonlyCheckbox value={committed ?? false} />
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* EDIT TRIGGER */}
                    <td className="p-2 text-center">
                      {!isEditing ? (
                        <button
                          onClick={() => startEdit(row)}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-[#45CC2D]/30 hover:text-[#45CC2D] transition-all"
                          title="Edit responses"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDrafts(prev => {
                              const next = { ...prev };
                              delete next[row.id];
                              return next;
                            });
                          }}
                          className="text-purple-400/60 hover:text-purple-300 transition-all"
                          title="Discard this row's changes"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* RIGHT SIDEBAR                                                        */}
      {/* ------------------------------------------------------------------- */}
      <div className="hidden lg:flex w-80 bg-black border-l border-[#45CC2D]/30 flex-col shrink-0">
        <div className="p-4 border-b border-[#45CC2D]/30 bg-[#45CC2D] text-black flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest">Survey Intelligence</span>
        </div>

        {/* SEARCH */}
        <div className="p-2 bg-black/40 border-b border-[#45CC2D]/20 shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#45CC2D]/40" />
            <input
              type="text"
              placeholder="FILTER NODES..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/50 border border-[#45CC2D]/30 pl-8 pr-2 py-2 text-[10px] text-[#45CC2D] placeholder-[#45CC2D]/30 outline-none focus:border-[#45CC2D] uppercase tracking-widest transition-all"
            />
          </div>
        </div>

        {/* STATS */}
        <div className="p-4 space-y-2 flex-1 overflow-y-auto scrollbar-hide">
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

          {/* ADMIN EDIT LEGEND */}
          <div className="mt-6 pt-4 border-t border-[#45CC2D]/10 space-y-2">
            <p className="text-[8px] opacity-40 uppercase tracking-widest font-bold">Override Legend</p>
            <div className="flex items-center gap-2">
              <span className="text-[7px] border border-purple-400/60 text-purple-400 px-1 font-bold">EDITED</span>
              <span className="text-[9px] opacity-60">Admin-overridden response</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[7px] border border-purple-400/50 text-purple-400 px-1 font-bold">PENDING</span>
              <span className="text-[9px] opacity-60">Unsaved draft in this session</span>
            </div>
            <p className="text-[8px] opacity-40 mt-2 leading-relaxed">
              Click the ✏ icon on any row to begin editing. Changes to multiple rows are batched — hit SAVE OVERRIDES to commit all.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}