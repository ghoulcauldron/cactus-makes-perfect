// apps/admin/components/InboxManager.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { apiFetch } from "../api/client";
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PlusIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  ChevronLeftIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/20/solid";

// ---------------------------------------------------------------------------
// SUPABASE REALTIME (read-only, anon key is fine for subscriptions)
// ---------------------------------------------------------------------------
// @ts-ignore
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface EyesOnlyMessage {
  id: string;
  guest_id: string;
  type: "inbound_comm" | "two_way_comm";
  subject: string | null;
  sent_at: string;
  is_read: boolean;
  is_archived: boolean;
  meta: { body?: string; from?: string; alias?: string } | null;
  guest?: { id: string; first_name: string; last_name: string; email: string } | null;
}

interface Thread {
  guest_id: string;
  guest: EyesOnlyMessage["guest"];
  messages: EyesOnlyMessage[];   // sorted oldest → newest
  unread_count: number;
  last_sent_at: string;
}

type Folder = "inbox" | "sent" | "all";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function guestLabel(thread: Thread) {
  if (thread.guest) return `${thread.guest.first_name} ${thread.guest.last_name}`;
  return thread.guest_id.slice(0, 8).toUpperCase();
}

function guestEmail(thread: Thread) {
  return thread.guest?.email ?? "";
}

function threadSubject(thread: Thread): string {
  // Use the subject of the first inbound message in the thread, or first message
  const first = thread.messages.find(m => m.type === "inbound_comm") ?? thread.messages[0];
  return first?.subject ?? "[SECURE TRANSMISSION]";
}

function msgBody(msg: EyesOnlyMessage): string {
  return msg.meta?.body ?? "[No Content]";
}

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "JUST NOW";
  if (m < 60) return `${m}M AGO`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H AGO`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}D AGO`;
  return new Date(dateStr).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function InboxManager() {
  const [threads, setThreads]             = useState<Thread[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);
  const [folder, setFolder]               = useState<Folder>("inbox");
  const [search, setSearch]               = useState("");

  // Compose state
  const [composing, setComposing]         = useState(false);
  const [composeEmail, setComposeEmail]   = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody]     = useState("");
  const [composeLookupState, setComposeLookupState] = useState<
    "idle" | "loading" | "found" | "notfound"
  >("idle");
  const [composeGuestId, setComposeGuestId] = useState<string | null>(null);

  // Reply state
  const [replyBody, setReplyBody]         = useState("");
  const [sending, setSending]             = useState(false);
  const [sendError, setSendError]         = useState<string | null>(null);

  // Optimistic message refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // DATA FETCH
  // ---------------------------------------------------------------------------
  const fetchThreads = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/email/threads");
      setThreads(res.threads || []);
    } catch (e) {
      console.error("[InboxManager] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // ---------------------------------------------------------------------------
  // REALTIME — patch only the affected thread, never blow away selected state
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel("eyes-only-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emails_log",
          filter: "type=in.(inbound_comm,two_way_comm)",
        },
        (payload: any) => {
          // Partial refetch — keeps activeGuestId intact
          fetchThreads();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads]);

  // ---------------------------------------------------------------------------
  // SCROLL TO BOTTOM when active thread messages change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeGuestId, threads]);

  // ---------------------------------------------------------------------------
  // DERIVED STATE
  // ---------------------------------------------------------------------------
  const activeThread = useMemo(
    () => threads.find(t => t.guest_id === activeGuestId) ?? null,
    [threads, activeGuestId]
  );

  const totalUnread = useMemo(
    () => threads.reduce((acc, t) => acc + t.unread_count, 0),
    [threads]
  );

  const filteredThreads = useMemo(() => {
    let list = threads.filter(t => {
      // Archived threads only show in "all"
      const allMsgsArchived = t.messages.every(m => m.is_archived);
      if (folder !== "all" && allMsgsArchived) return false;

      if (folder === "inbox") {
        // Has at least one unread inbound, OR latest message is inbound
        const latestMsg = t.messages[t.messages.length - 1];
        return t.unread_count > 0 || latestMsg?.type === "inbound_comm";
      }
      if (folder === "sent") {
        // Admin has replied at least once
        return t.messages.some(m => m.type === "two_way_comm");
      }
      return true; // "all"
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        guestLabel(t).toLowerCase().includes(q) ||
        guestEmail(t).toLowerCase().includes(q) ||
        threadSubject(t).toLowerCase().includes(q)
      );
    }

    return list;
  }, [threads, folder, search]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------

  // Mark messages read — only fires once per thread open, no loop
  const markThreadRead = useCallback(async (thread: Thread) => {
    const unreadIds = thread.messages
      .filter(m => m.type === "inbound_comm" && !m.is_read)
      .map(m => m.id);

    if (unreadIds.length === 0) return;

    // Optimistic update
    setThreads(prev =>
      prev.map(t =>
        t.guest_id === thread.guest_id
          ? {
              ...t,
              unread_count: 0,
              messages: t.messages.map(m =>
                unreadIds.includes(m.id) ? { ...m, is_read: true } : m
              ),
            }
          : t
      )
    );

    await apiFetch("/admin/email/read-status", {
      method: "PATCH",
      body: JSON.stringify({ email_ids: unreadIds, is_read: true }),
    }).catch(console.error);
  }, []);

  const openThread = useCallback((thread: Thread) => {
    setActiveGuestId(thread.guest_id);
    setComposing(false);
    setReplyBody("");
    setSendError(null);
    markThreadRead(thread);
  }, [markThreadRead]);

  const archiveThread = useCallback(async (thread: Thread) => {
    const ids = thread.messages.filter(m => m.type === "inbound_comm").map(m => m.id);
    if (ids.length === 0) return;

    // Optimistic
    setThreads(prev =>
      prev.map(t =>
        t.guest_id === thread.guest_id
          ? { ...t, messages: t.messages.map(m => ids.includes(m.id) ? { ...m, is_archived: true } : m) }
          : t
      )
    );
    if (activeGuestId === thread.guest_id) setActiveGuestId(null);

    await apiFetch("/admin/email/status", {
      method: "PATCH",
      body: JSON.stringify({ email_ids: ids, is_archived: true }),
    }).catch(console.error);
  }, [activeGuestId]);

  const sendReply = useCallback(async () => {
    if (!replyBody.trim() || !activeThread) return;
    setSending(true);
    setSendError(null);

    const optimisticMsg: EyesOnlyMessage = {
      id: `optimistic-${Date.now()}`,
      guest_id: activeThread.guest_id,
      type: "two_way_comm",
      subject: threadSubject(activeThread),
      sent_at: new Date().toISOString(),
      is_read: true,
      is_archived: false,
      meta: { body: replyBody },
      guest: activeThread.guest,
    };

    // Optimistic insert
    setThreads(prev =>
      prev.map(t =>
        t.guest_id === activeThread.guest_id
          ? { ...t, messages: [...t.messages, optimisticMsg], last_sent_at: optimisticMsg.sent_at }
          : t
      )
    );
    setReplyBody("");

    try {
      await apiFetch("/admin/email/send", {
        method: "POST",
        body: JSON.stringify({
          guest_id: activeThread.guest_id,
          subject: `RE: ${threadSubject(activeThread).replace(/^RE:\s*/i, "")}`,
          text: replyBody,
        }),
      });
      // Real-time will update with the committed row; no need to manually refetch
    } catch (e: any) {
      setSendError("DISPATCH FAILED — CHECK CONNECTION");
      // Rollback optimistic message
      setThreads(prev =>
        prev.map(t =>
          t.guest_id === activeThread.guest_id
            ? { ...t, messages: t.messages.filter(m => m.id !== optimisticMsg.id) }
            : t
        )
      );
    } finally {
      setSending(false);
    }
  }, [replyBody, activeThread]);

  // ---------------------------------------------------------------------------
  // COMPOSE — new message flow
  // ---------------------------------------------------------------------------
  const startCompose = () => {
    setActiveGuestId(null);
    setComposing(true);
    setComposeEmail("");
    setComposeSubject("");
    setComposeBody("");
    setComposeLookupState("idle");
    setComposeGuestId(null);
    setSendError(null);
  };

  const lookupGuest = useCallback(async (email: string) => {
    if (!email.trim()) return;
    setComposeLookupState("loading");
    try {
      const res = await apiFetch(`/admin/email/guest-lookup?email=${encodeURIComponent(email.trim())}`);
      setComposeGuestId(res.guest.id);
      setComposeLookupState("found");
    } catch {
      setComposeGuestId(null);
      setComposeLookupState("notfound");
    }
  }, []);

  const sendNewMessage = useCallback(async () => {
    if (!composeBody.trim() || !composeGuestId) return;
    setSending(true);
    setSendError(null);
    try {
      await apiFetch("/admin/email/send", {
        method: "POST",
        body: JSON.stringify({
          guest_id: composeGuestId,
          subject: composeSubject || "[SECURE TRANSMISSION]",
          text: composeBody,
        }),
      });
      setComposing(false);
      await fetchThreads();
      // Open the thread we just started
      setActiveGuestId(composeGuestId);
    } catch {
      setSendError("DISPATCH FAILED — CHECK CONNECTION");
    } finally {
      setSending(false);
    }
  }, [composeBody, composeGuestId, composeSubject, fetchThreads]);

  // ---------------------------------------------------------------------------
  // KEYBOARD — Cmd/Ctrl+Enter to send
  // ---------------------------------------------------------------------------
  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendReply();
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  const showPane = activeGuestId !== null || composing;

  return (
    <div className="h-full flex bg-black font-mono text-[#45CC2D] overflow-hidden">

      {/* ================================================================= */}
      {/* LEFT RAIL                                                          */}
      {/* ================================================================= */}
      <div className={`
        w-14 border-r border-[#45CC2D]/20 flex flex-col items-center py-5 gap-6 
        bg-neutral-900/20 flex-shrink-0
        ${showPane ? "hidden lg:flex" : "flex"}
      `}>
        {/* Compose */}
        <button
          onClick={startCompose}
          title="New Transmission"
          className="p-2 border border-[#45CC2D]/40 hover:bg-[#45CC2D]/10 hover:border-[#45CC2D] transition-all relative"
        >
          <PlusIcon className="h-5 w-5" />
        </button>

        {/* Folder buttons */}
        {(["inbox", "sent", "all"] as Folder[]).map(f => {
          const labels: Record<Folder, string> = { inbox: "INBX", sent: "SENT", all: "ALL" };
          const isActive = folder === f;
          return (
            <button
              key={f}
              onClick={() => setFolder(f)}
              title={f.toUpperCase()}
              className="flex flex-col items-center gap-0.5 relative"
            >
              {f === "inbox" ? (
                <EnvelopeIcon className={`h-5 w-5 transition-opacity ${isActive ? "opacity-100" : "opacity-25"}`} />
              ) : f === "sent" ? (
                <PaperAirplaneIcon className={`h-5 w-5 transition-opacity ${isActive ? "opacity-100" : "opacity-25"}`} />
              ) : (
                <EnvelopeOpenIcon className={`h-5 w-5 transition-opacity ${isActive ? "opacity-100" : "opacity-25"}`} />
              )}
              <span className={`text-[7px] font-bold tracking-widest transition-opacity ${isActive ? "opacity-100" : "opacity-25"}`}>
                {labels[f]}
              </span>
              {f === "inbox" && totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#45CC2D] text-black text-[7px] font-black px-1 min-w-[14px] text-center shadow-[0_0_8px_#45CC2D]">
                  {totalUnread}
                </span>
              )}
            </button>
          );
        })}

        {/* Refresh */}
        <button
          onClick={fetchThreads}
          title="Sync"
          className={`mt-auto opacity-30 hover:opacity-100 transition-opacity ${loading ? "animate-spin" : ""}`}
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ================================================================= */}
      {/* THREAD LIST                                                        */}
      {/* ================================================================= */}
      <div className={`
        w-full lg:w-72 border-r border-[#45CC2D]/20 flex flex-col bg-black flex-shrink-0
        ${showPane ? "hidden lg:flex" : "flex"}
      `}>
        {/* List header */}
        <div className="px-3 py-3 border-b border-[#45CC2D]/20 bg-neutral-900/40 space-y-2 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest">{folder.toUpperCase()}</span>
            <span className="text-[8px] opacity-30">{filteredThreads.length} THREADS</span>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30" />
            <input
              type="text"
              placeholder="FILTER NODES..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black border border-[#45CC2D]/20 pl-7 pr-2 py-1.5 text-[9px] outline-none focus:border-[#45CC2D]/50 transition-colors placeholder-[#45CC2D]/20 uppercase tracking-widest"
            />
          </div>
        </div>

        {/* Thread rows */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="p-6 text-center text-[10px] opacity-30 animate-pulse uppercase">SCANNING...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-[10px] opacity-20 uppercase tracking-widest">NO TRANSMISSIONS</div>
          ) : (
            filteredThreads.map(thread => {
              const latestMsg = thread.messages[thread.messages.length - 1];
              const isActive = activeGuestId === thread.guest_id;
              const hasUnread = thread.unread_count > 0;

              return (
                <div
                  key={thread.guest_id}
                  onClick={() => openThread(thread)}
                  className={`
                    relative px-3 py-3 border-b border-[#45CC2D]/10 cursor-pointer transition-all group
                    ${isActive ? "bg-[#45CC2D]/10 border-l-2 border-l-[#45CC2D]" : "hover:bg-[#45CC2D]/5"}
                  `}
                >
                  {/* Unread indicator bar */}
                  {hasUnread && !isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#45CC2D] shadow-[1px_0_8px_#45CC2D]" />
                  )}

                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase truncate ${hasUnread ? "text-white" : "text-[#45CC2D]/70"}`}>
                      {guestLabel(thread)}
                    </span>
                    <span className="text-[8px] opacity-30 shrink-0">{relTime(thread.last_sent_at)}</span>
                  </div>

                  <p className={`text-[9px] truncate mb-1 ${hasUnread ? "text-[#45CC2D]" : "opacity-30"}`}>
                    {threadSubject(thread)}
                  </p>

                  <p className="text-[8px] opacity-20 truncate">
                    {msgBody(latestMsg).slice(0, 60)}
                  </p>

                  {/* Unread badge + archive button */}
                  <div className="flex justify-between items-center mt-1.5">
                    {hasUnread ? (
                      <span className="text-[7px] bg-[#45CC2D] text-black font-black px-1">{thread.unread_count} NEW</span>
                    ) : (
                      <span className="text-[7px] opacity-20">{thread.messages.length} MSG{thread.messages.length !== 1 ? "S" : ""}</span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); archiveThread(thread); }}
                      className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                      title="Archive thread"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* READING / COMPOSE PANE                                            */}
      {/* ================================================================= */}
      <div className={`flex-1 flex flex-col bg-neutral-900/5 overflow-hidden ${showPane ? "flex" : "hidden lg:flex"}`}>

        {/* ---- COMPOSE NEW MESSAGE ---- */}
        {composing && !activeGuestId && (
          <>
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-[#45CC2D]/20 flex items-center gap-3 bg-black">
              <button
                onClick={() => setComposing(false)}
                className="lg:hidden p-1 hover:bg-[#45CC2D]/10"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-xs font-black uppercase tracking-widest">NEW TRANSMISSION</span>
              <button onClick={() => setComposing(false)} className="ml-auto opacity-30 hover:opacity-100">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Compose form */}
            <div className="flex-1 flex flex-col p-4 lg:p-6 gap-3 overflow-y-auto">
              {/* TO field with lookup */}
              <div className="border border-[#45CC2D]/20 bg-black">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#45CC2D]/10">
                  <span className="text-[9px] opacity-40 font-bold w-8 shrink-0">TO:</span>
                  <input
                    type="email"
                    placeholder="GUEST_EMAIL@..."
                    value={composeEmail}
                    onChange={e => {
                      setComposeEmail(e.target.value);
                      setComposeLookupState("idle");
                      setComposeGuestId(null);
                    }}
                    onBlur={() => { if (composeEmail.trim()) lookupGuest(composeEmail); }}
                    onKeyDown={e => { if (e.key === "Enter") lookupGuest(composeEmail); }}
                    className="flex-1 bg-transparent outline-none text-[10px] uppercase tracking-widest"
                  />
                  {/* Lookup status */}
                  {composeLookupState === "loading" && (
                    <ArrowPathIcon className="h-3 w-3 animate-spin opacity-40" />
                  )}
                  {composeLookupState === "found" && (
                    <span className="text-[8px] bg-[#45CC2D] text-black px-1 font-bold">VERIFIED</span>
                  )}
                  {composeLookupState === "notfound" && (
                    <span className="text-[8px] border border-red-500/60 text-red-400 px-1 font-bold">NOT FOUND</span>
                  )}
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[9px] opacity-40 font-bold w-8 shrink-0">SUB:</span>
                  <input
                    type="text"
                    placeholder="SUBJECT_LINE"
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-[10px] uppercase tracking-widest"
                  />
                </div>
              </div>

              {/* Body */}
              <textarea
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                placeholder="ENTER TRANSMISSION..."
                className="flex-1 min-h-[160px] bg-black border border-[#45CC2D]/20 p-3 text-xs text-[#45CC2D] placeholder-[#45CC2D]/20 outline-none resize-none focus:border-[#45CC2D]/50"
              />

              {sendError && (
                <p className="text-[9px] text-red-400 border border-red-500/30 px-2 py-1">{sendError}</p>
              )}

              <div className="flex justify-end">
                <button
                  onClick={sendNewMessage}
                  disabled={sending || !composeBody.trim() || composeLookupState !== "found"}
                  className="flex items-center gap-2 border border-[#45CC2D] px-5 py-2 text-[10px] font-bold uppercase hover:bg-[#45CC2D] hover:text-black transition-all disabled:opacity-20"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {sending ? "DISPATCHING..." : "DISPATCH"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ---- ACTIVE THREAD ---- */}
        {activeThread && (
          <>
            {/* Thread header */}
            <div className="shrink-0 px-4 py-3 border-b border-[#45CC2D]/20 flex items-center justify-between bg-black">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setActiveGuestId(null)}
                  className="lg:hidden p-1 hover:bg-[#45CC2D]/10 shrink-0"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm font-black uppercase tracking-tight truncate">
                    {guestLabel(activeThread)}
                  </h2>
                  <p className="text-[8px] opacity-40 truncate">{guestEmail(activeThread)} // {threadSubject(activeThread)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:block text-[8px] opacity-20">
                  {activeThread.messages.length} MSG{activeThread.messages.length !== 1 ? "S" : ""}
                </span>
                <button
                  onClick={() => archiveThread(activeThread)}
                  className="opacity-30 hover:opacity-100 transition-opacity p-1"
                  title="Archive thread"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4 scrollbar-hide">
              {activeThread.messages.map(msg => {
                const isInbound = msg.type === "inbound_comm";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] lg:max-w-[70%] ${isInbound ? "self-start items-start" : "self-end items-end ml-auto"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isInbound ? (
                        <UserIcon className="h-3 w-3 opacity-40" />
                      ) : (
                        <PaperAirplaneIcon className="h-3 w-3 opacity-40" />
                      )}
                      <span className="text-[7px] opacity-30 uppercase">
                        {isInbound ? "INBOUND" : "OUTBOUND"} // {relTime(msg.sent_at)}
                      </span>
                    </div>
                    <div
                      className={`px-4 py-3 text-xs leading-relaxed border whitespace-pre-wrap break-words
                        ${isInbound
                          ? "border-[#45CC2D]/30 bg-black text-[#45CC2D]"
                          : "border-[#45CC2D]/15 bg-[#45CC2D]/5 text-[#45CC2D]/80"
                        }`}
                    >
                      {msgBody(msg)}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply composer */}
            <div className="shrink-0 border-t border-[#45CC2D]/20 bg-black px-4 lg:px-6 py-3 space-y-2">
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                placeholder="ENTER REPLY... (⌘↵ to send)"
                className="w-full bg-transparent text-xs text-[#45CC2D] placeholder-[#45CC2D]/20 outline-none resize-none h-20 lg:h-24 border-none"
              />
              {sendError && (
                <p className="text-[9px] text-red-400">{sendError}</p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={sendReply}
                  disabled={sending || !replyBody.trim()}
                  className="flex items-center gap-2 border border-[#45CC2D] px-5 py-2 text-[10px] font-bold uppercase hover:bg-[#45CC2D] hover:text-black transition-all disabled:opacity-20"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                  {sending ? "DISPATCHING..." : "DISPATCH"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ---- EMPTY STATE ---- */}
        {!activeThread && !composing && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-10">
            <EnvelopeIcon className="h-10 w-10" />
            <span className="text-[10px] tracking-[0.5em] uppercase">Select Transmission</span>
          </div>
        )}
      </div>
    </div>
  );
}