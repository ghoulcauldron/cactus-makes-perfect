// apps/admin/components/InboxManager.tsx
import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from "react";
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
  DocumentTextIcon,
  CodeBracketIcon,
  EyeIcon,
  BookmarkIcon,
  CheckIcon,
} from "@heroicons/react/20/solid";

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
  messages: EyesOnlyMessage[];
  unread_count: number;
  last_sent_at: string;
}

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  rsvp_status: string | null;
}

interface Draft {
  id: string;
  guest_id: string | null;
  subject: string | null;
  body: string | null;
  is_html: boolean;
  context: "new" | "reply";
  updated_at: string;
}

type Folder     = "inbox" | "sent" | "all";
type EditorMode = "text" | "html";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function guestLabel(t: Thread) {
  return t.guest ? `${t.guest.first_name} ${t.guest.last_name}` : t.guest_id.slice(0, 8).toUpperCase();
}
function guestEmail(t: Thread) { return t.guest?.email ?? ""; }
function threadSubject(t: Thread): string {
  const first = t.messages.find(m => m.type === "inbound_comm") ?? t.messages[0];
  return first?.subject ?? "[SECURE TRANSMISSION]";
}
function msgBody(msg: EyesOnlyMessage): string { return msg.meta?.body ?? "[No Content]"; }
function relTime(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "JUST NOW";
  if (m < 60) return `${m}M AGO`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H AGO`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}D AGO`;
  return new Date(d).toLocaleDateString();
}
function recipientLabel(r: Recipient) { return `${r.first_name} ${r.last_name}`; }

// ---------------------------------------------------------------------------
// DEBOUNCE HOOK
// ---------------------------------------------------------------------------
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

// ---------------------------------------------------------------------------
// HTML EDITOR COMPONENT (shared by compose + reply)
// ---------------------------------------------------------------------------
interface HtmlEditorProps {
  body: string;
  isHtml: boolean;
  placeholder: string;
  onBodyChange: (v: string) => void;
  onModeChange: (v: boolean) => void;
  minHeight?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function HtmlEditor({ body, isHtml, placeholder, onBodyChange, onModeChange, minHeight = "h-40", onKeyDown }: HtmlEditorProps) {
  const [preview, setPreview] = useState(false);
  const mode: EditorMode = isHtml ? "html" : "text";

  return (
    <div className="flex flex-col gap-0 border border-[#45CC2D]/20 bg-black">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#45CC2D]/10 bg-black/60">
        <button
          onClick={() => { onModeChange(false); setPreview(false); }}
          className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all
            ${mode === "text" ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]/40 hover:text-[#45CC2D]"}`}
        >
          <DocumentTextIcon className="h-3 w-3" /> TEXT
        </button>
        <button
          onClick={() => { onModeChange(true); setPreview(false); }}
          className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all
            ${mode === "html" && !preview ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]/40 hover:text-[#45CC2D]"}`}
        >
          <CodeBracketIcon className="h-3 w-3" /> HTML
        </button>
        {isHtml && (
          <button
            onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all
              ${preview ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]/40 hover:text-[#45CC2D]"}`}
          >
            <EyeIcon className="h-3 w-3" /> PREVIEW
          </button>
        )}
        <span className="ml-auto text-[7px] opacity-20 tracking-widest">
          {isHtml ? "HTML MODE" : "PLAIN TEXT"} // {body.length} CHARS
        </span>
      </div>

      {/* Editor / Preview */}
      {preview && isHtml ? (
        <iframe
          title="HTML Preview"
          srcDoc={body || "<div style='font-family:monospace;color:#666;padding:20px'>[No content]</div>"}
          className={`w-full ${minHeight} border-none bg-white`}
          sandbox="allow-same-origin"
        />
      ) : (
        <textarea
          value={body}
          onChange={e => onBodyChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isHtml ? "<!-- ENTER HTML... -->" : placeholder}
          className={`w-full ${minHeight} bg-transparent text-xs text-[#45CC2D] placeholder-[#45CC2D]/20 
            outline-none resize-none p-3 border-none font-mono leading-relaxed`}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RECIPIENT COMBOBOX
// ---------------------------------------------------------------------------
interface RecipientPickerProps {
  value: string;
  confirmed: Recipient[];
  others: Recipient[];
  lookupState: "idle" | "loading" | "found" | "notfound";
  onChange: (email: string) => void;
  onSelect: (r: Recipient) => void;
  onLookup: (email: string) => void;
}

function RecipientPicker({ value, confirmed, others, lookupState, onChange, onSelect, onLookup }: RecipientPickerProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredConfirmed = useMemo(() => {
    const q = filter.toLowerCase();
    return confirmed.filter(r =>
      recipientLabel(r).toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }, [confirmed, filter]);

  const filteredOthers = useMemo(() => {
    const q = filter.toLowerCase();
    return others.filter(r =>
      recipientLabel(r).toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }, [others, filter]);

  return (
    <div ref={ref} className="relative flex-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="SELECT OR TYPE EMAIL..."
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setFilter(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => {
            if (value.trim()) onLookup(value);
          }, 200)}
          onKeyDown={e => {
            if (e.key === "Enter") { onLookup(value); setOpen(false); }
            if (e.key === "Escape") setOpen(false);
          }}
          className="flex-1 bg-transparent outline-none text-[10px] uppercase tracking-widest"
        />
        {lookupState === "loading" && <ArrowPathIcon className="h-3 w-3 animate-spin opacity-40 shrink-0" />}
        {lookupState === "found"   && <span className="text-[8px] bg-[#45CC2D] text-black px-1 font-bold shrink-0">VERIFIED</span>}
        {lookupState === "notfound" && <span className="text-[8px] border border-red-500/60 text-red-400 px-1 font-bold shrink-0">NOT FOUND</span>}
        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 opacity-30 hover:opacity-100 transition-opacity"
          title="Browse recipients"
        >
          <ChevronLeftIcon className={`h-3 w-3 transition-transform ${open ? "-rotate-90" : "rotate-180"}`} />
        </button>
      </div>

      {open && (filteredConfirmed.length > 0 || filteredOthers.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-black border border-[#45CC2D]/60 shadow-2xl max-h-64 overflow-y-auto scrollbar-hide">
          {filteredConfirmed.length > 0 && (
            <>
              <div className="px-3 py-1 text-[7px] font-black uppercase tracking-widest opacity-40 border-b border-[#45CC2D]/10 bg-[#45CC2D]/5">
                Confirmed / Maybe ({filteredConfirmed.length})
              </div>
              {filteredConfirmed.map(r => (
                <button
                  key={r.id}
                  onMouseDown={e => { e.preventDefault(); onSelect(r); setOpen(false); setFilter(""); }}
                  className="w-full text-left px-3 py-2 hover:bg-[#45CC2D]/10 transition-colors flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase">{recipientLabel(r)}</span>
                    <span className="block text-[8px] opacity-40">{r.email}</span>
                  </div>
                  <span className={`text-[7px] font-bold px-1 border shrink-0
                    ${r.rsvp_status === "yes"   ? "border-[#45CC2D]/50 text-[#45CC2D]" : "border-yellow-500/40 text-yellow-500"}`}>
                    {r.rsvp_status?.toUpperCase()}
                  </span>
                </button>
              ))}
            </>
          )}
          {filteredOthers.length > 0 && (
            <>
              <div className="px-3 py-1 text-[7px] font-black uppercase tracking-widest opacity-40 border-b border-[#45CC2D]/10 mt-1">
                Other Guests ({filteredOthers.length})
              </div>
              {filteredOthers.map(r => (
                <button
                  key={r.id}
                  onMouseDown={e => { e.preventDefault(); onSelect(r); setOpen(false); setFilter(""); }}
                  className="w-full text-left px-3 py-2 hover:bg-[#45CC2D]/10 transition-colors"
                >
                  <span className="text-[10px] font-bold uppercase opacity-60">{recipientLabel(r)}</span>
                  <span className="block text-[8px] opacity-30">{r.email}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function InboxManager() {
  const [threads, setThreads]           = useState<Thread[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);
  const [folder, setFolder]             = useState<Folder>("inbox");
  const [search, setSearch]             = useState("");

  // Recipients for picker
  const [confirmedRecipients, setConfirmedRecipients] = useState<Recipient[]>([]);
  const [otherRecipients, setOtherRecipients]         = useState<Recipient[]>([]);

  // Compose state
  const [composing, setComposing]           = useState(false);
  const [composeEmail, setComposeEmail]     = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody]       = useState("");
  const [composeIsHtml, setComposeIsHtml]   = useState(false);
  const [composeLookupState, setComposeLookupState] = useState<"idle"|"loading"|"found"|"notfound">("idle");
  const [composeGuestId, setComposeGuestId] = useState<string | null>(null);
  // Draft tracking for compose
  const [composeDraftId, setComposeDraftId]   = useState<string | null>(null);
  const [composeDraftSaved, setComposeDraftSaved] = useState(false);
  const [composeDraftSaving, setComposeDraftSaving] = useState(false);

  // Reply state
  const [replyBody, setReplyBody]         = useState("");
  const [replyIsHtml, setReplyIsHtml]     = useState(false);
  // Draft tracking for reply
  const [replyDraftId, setReplyDraftId]     = useState<string | null>(null);
  const [replyDraftSaved, setReplyDraftSaved] = useState(false);
  const [replyDraftSaving, setReplyDraftSaving] = useState(false);

  // Shared send state
  const [sending, setSending]             = useState(false);
  const [sendError, setSendError]         = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounce body changes for auto-save indicator
  const debouncedComposeBody = useDebounce(composeBody, 800);
  const debouncedReplyBody   = useDebounce(replyBody,   800);

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

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/email/recipients");
      setConfirmedRecipients(res.confirmed || []);
      setOtherRecipients(res.others || []);
    } catch (e) {
      console.error("[InboxManager] recipients fetch failed", e);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
    fetchRecipients();
  }, [fetchThreads, fetchRecipients]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("eyes-only-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "emails_log",
          filter: "type=in.(inbound_comm,two_way_comm)" },
        () => fetchThreads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeGuestId, threads]);

  // Mark compose draft as unsaved when body changes
  useEffect(() => {
    if (composeDraftId && debouncedComposeBody) setComposeDraftSaved(false);
  }, [debouncedComposeBody, composeDraftId]);

  // Mark reply draft as unsaved when body changes
  useEffect(() => {
    if (replyDraftId && debouncedReplyBody) setReplyDraftSaved(false);
  }, [debouncedReplyBody, replyDraftId]);

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
      const allArchived = t.messages.every(m => m.is_archived);
      if (folder !== "all" && allArchived) return false;
      if (folder === "inbox") {
        const latest = t.messages[t.messages.length - 1];
        return t.unread_count > 0 || latest?.type === "inbound_comm";
      }
      if (folder === "sent") return t.messages.some(m => m.type === "two_way_comm");
      return true;
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
  // DRAFT SAVE
  // ---------------------------------------------------------------------------
  const saveComposeDraft = useCallback(async () => {
    if (!composeBody.trim() && !composeSubject.trim()) return;
    setComposeDraftSaving(true);
    try {
      if (composeDraftId) {
        await apiFetch(`/admin/email/drafts/${composeDraftId}`, {
          method: "PATCH",
          body: JSON.stringify({
            guest_id: composeGuestId,
            subject:  composeSubject,
            body:     composeBody,
            is_html:  composeIsHtml,
            context:  "new",
          }),
        });
      } else {
        const res = await apiFetch("/admin/email/drafts", {
          method: "POST",
          body: JSON.stringify({
            guest_id: composeGuestId,
            subject:  composeSubject,
            body:     composeBody,
            is_html:  composeIsHtml,
            context:  "new",
          }),
        });
        setComposeDraftId(res.draft.id);
      }
      setComposeDraftSaved(true);
    } catch (e) {
      console.error("[DraftSave] compose failed", e);
    } finally {
      setComposeDraftSaving(false);
    }
  }, [composeDraftId, composeGuestId, composeSubject, composeBody, composeIsHtml]);

  const saveReplyDraft = useCallback(async () => {
    if (!replyBody.trim() || !activeThread) return;
    setReplyDraftSaving(true);
    try {
      if (replyDraftId) {
        await apiFetch(`/admin/email/drafts/${replyDraftId}`, {
          method: "PATCH",
          body: JSON.stringify({ body: replyBody, is_html: replyIsHtml, context: "reply" }),
        });
      } else {
        const res = await apiFetch("/admin/email/drafts", {
          method: "POST",
          body: JSON.stringify({
            guest_id: activeThread.guest_id,
            subject:  `RE: ${threadSubject(activeThread)}`,
            body:     replyBody,
            is_html:  replyIsHtml,
            context:  "reply",
          }),
        });
        setReplyDraftId(res.draft.id);
      }
      setReplyDraftSaved(true);
    } catch (e) {
      console.error("[DraftSave] reply failed", e);
    } finally {
      setReplyDraftSaving(false);
    }
  }, [replyDraftId, replyBody, replyIsHtml, activeThread]);

  const deleteReplyDraft = useCallback(async (draftId: string) => {
    try { await apiFetch(`/admin/email/drafts/${draftId}`, { method: "DELETE" }); } catch {}
  }, []);

  // Load existing reply draft when switching threads
  const loadReplyDraft = useCallback(async (guestId: string) => {
    try {
      const res = await apiFetch(`/admin/email/drafts?guest_id=${guestId}&context=reply`);
      const draft: Draft | undefined = res.drafts?.[0];
      if (draft) {
        setReplyBody(draft.body ?? "");
        setReplyIsHtml(draft.is_html);
        setReplyDraftId(draft.id);
        setReplyDraftSaved(true);
      } else {
        setReplyBody("");
        setReplyIsHtml(false);
        setReplyDraftId(null);
        setReplyDraftSaved(false);
      }
    } catch {
      setReplyBody("");
      setReplyDraftId(null);
    }
  }, []);

  // Load most recent new-compose draft when opening compose
  const loadComposeDraft = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/email/drafts?context=new");
      const draft: Draft | undefined = res.drafts?.[0];
      if (draft) {
        setComposeBody(draft.body ?? "");
        setComposeSubject(draft.subject ?? "");
        setComposeIsHtml(draft.is_html);
        setComposeDraftId(draft.id);
        setComposeDraftSaved(true);
        // Try to pre-fill recipient if draft has guest_id
        if (draft.guest_id) {
          setComposeGuestId(draft.guest_id);
          const all = [...confirmedRecipients, ...otherRecipients];
          const match = all.find(r => r.id === draft.guest_id);
          if (match) { setComposeEmail(match.email); setComposeLookupState("found"); }
        }
      }
    } catch {}
  }, [confirmedRecipients, otherRecipients]);

  // ---------------------------------------------------------------------------
  // THREAD ACTIONS
  // ---------------------------------------------------------------------------
  const markThreadRead = useCallback(async (thread: Thread) => {
    const unreadIds = thread.messages.filter(m => m.type === "inbound_comm" && !m.is_read).map(m => m.id);
    if (!unreadIds.length) return;
    setThreads(prev => prev.map(t =>
      t.guest_id === thread.guest_id
        ? { ...t, unread_count: 0, messages: t.messages.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m) }
        : t
    ));
    await apiFetch("/admin/email/read-status", {
      method: "PATCH",
      body: JSON.stringify({ email_ids: unreadIds, is_read: true }),
    }).catch(console.error);
  }, []);

  const openThread = useCallback((thread: Thread) => {
    setActiveGuestId(thread.guest_id);
    setComposing(false);
    setSendError(null);
    markThreadRead(thread);
    loadReplyDraft(thread.guest_id);
  }, [markThreadRead, loadReplyDraft]);

  const archiveThread = useCallback(async (thread: Thread) => {
    const ids = thread.messages.filter(m => m.type === "inbound_comm").map(m => m.id);
    if (!ids.length) return;
    setThreads(prev => prev.map(t =>
      t.guest_id === thread.guest_id
        ? { ...t, messages: t.messages.map(m => ids.includes(m.id) ? { ...m, is_archived: true } : m) }
        : t
    ));
    if (activeGuestId === thread.guest_id) setActiveGuestId(null);
    await apiFetch("/admin/email/status", {
      method: "PATCH",
      body: JSON.stringify({ email_ids: ids, is_archived: true }),
    }).catch(console.error);
  }, [activeGuestId]);

  // ---------------------------------------------------------------------------
  // SEND
  // ---------------------------------------------------------------------------
  const sendReply = useCallback(async () => {
    if (!replyBody.trim() || !activeThread) return;
    setSending(true);
    setSendError(null);

    const optimistic: EyesOnlyMessage = {
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

    setThreads(prev => prev.map(t =>
      t.guest_id === activeThread.guest_id
        ? { ...t, messages: [...t.messages, optimistic], last_sent_at: optimistic.sent_at }
        : t
    ));
    const bodyToSend = replyBody;
    setReplyBody("");

    try {
      await apiFetch("/admin/email/send", {
        method: "POST",
        body: JSON.stringify({
          guest_id: activeThread.guest_id,
          subject:  `RE: ${threadSubject(activeThread).replace(/^RE:\s*/i, "")}`,
          text:     replyIsHtml ? "" : bodyToSend,
          html:     replyIsHtml ? bodyToSend : undefined,
        }),
      });
      // Delete the draft now that it's sent
      if (replyDraftId) { await deleteReplyDraft(replyDraftId); setReplyDraftId(null); setReplyDraftSaved(false); }
    } catch {
      setSendError("DISPATCH FAILED — CHECK CONNECTION");
      setThreads(prev => prev.map(t =>
        t.guest_id === activeThread.guest_id
          ? { ...t, messages: t.messages.filter(m => m.id !== optimistic.id) }
          : t
      ));
      setReplyBody(bodyToSend);
    } finally {
      setSending(false);
    }
  }, [replyBody, replyIsHtml, replyDraftId, activeThread, deleteReplyDraft]);

  const sendNewMessage = useCallback(async () => {
    if (!composeBody.trim() || !composeGuestId) return;
    setSending(true);
    setSendError(null);
    try {
      await apiFetch("/admin/email/send", {
        method: "POST",
        body: JSON.stringify({
          guest_id: composeGuestId,
          subject:  composeSubject || "[SECURE TRANSMISSION]",
          text:     composeIsHtml ? "" : composeBody,
          html:     composeIsHtml ? composeBody : undefined,
        }),
      });
      // Delete draft on send
      if (composeDraftId) { await apiFetch(`/admin/email/drafts/${composeDraftId}`, { method: "DELETE" }); }
      setComposing(false);
      setComposeDraftId(null);
      await fetchThreads();
      setActiveGuestId(composeGuestId);
    } catch {
      setSendError("DISPATCH FAILED — CHECK CONNECTION");
    } finally {
      setSending(false);
    }
  }, [composeBody, composeIsHtml, composeGuestId, composeSubject, composeDraftId, fetchThreads]);

  // ---------------------------------------------------------------------------
  // COMPOSE FLOW
  // ---------------------------------------------------------------------------
  const startCompose = useCallback(() => {
    setActiveGuestId(null);
    setComposing(true);
    setComposeEmail("");
    setComposeSubject("");
    setComposeBody("");
    setComposeIsHtml(false);
    setComposeLookupState("idle");
    setComposeGuestId(null);
    setComposeDraftId(null);
    setComposeDraftSaved(false);
    setSendError(null);
    // Load most recent draft after state resets
    setTimeout(() => loadComposeDraft(), 50);
  }, [loadComposeDraft]);

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

  const selectRecipient = useCallback((r: Recipient) => {
    setComposeEmail(r.email);
    setComposeGuestId(r.id);
    setComposeLookupState("found");
  }, []);

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); sendReply(); }
  };

  // ---------------------------------------------------------------------------
  // DRAFT STATUS BADGE
  // ---------------------------------------------------------------------------
  function DraftBadge({ saving, saved }: { saving: boolean; saved: boolean }) {
    if (saving) return (
      <span className="flex items-center gap-1 text-[8px] text-[#45CC2D]/40">
        <ArrowPathIcon className="h-2.5 w-2.5 animate-spin" /> SAVING...
      </span>
    );
    if (saved) return (
      <span className="flex items-center gap-1 text-[8px] text-[#45CC2D]/50">
        <CheckIcon className="h-2.5 w-2.5" /> DRAFT SAVED
      </span>
    );
    return null;
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  const showPane = activeGuestId !== null || composing;

  return (
    <div className="h-full flex bg-black font-mono text-[#45CC2D] overflow-hidden">

      {/* ================================================================= */}
      {/* RAIL                                                               */}
      {/* ================================================================= */}
      <div className={`w-14 border-r border-[#45CC2D]/20 flex flex-col items-center py-5 gap-6
        bg-neutral-900/20 flex-shrink-0 ${showPane ? "hidden lg:flex" : "flex"}`}>
        <button onClick={startCompose} title="New Transmission"
          className="p-2 border border-[#45CC2D]/40 hover:bg-[#45CC2D]/10 hover:border-[#45CC2D] transition-all">
          <PlusIcon className="h-5 w-5" />
        </button>
        {(["inbox", "sent", "all"] as Folder[]).map(f => {
          const labels: Record<Folder, string> = { inbox: "INBX", sent: "SENT", all: "ALL" };
          const isActive = folder === f;
          return (
            <button key={f} onClick={() => setFolder(f)} title={f.toUpperCase()}
              className="flex flex-col items-center gap-0.5 relative">
              {f === "inbox"
                ? <EnvelopeIcon className={`h-5 w-5 ${isActive ? "opacity-100" : "opacity-25"}`} />
                : f === "sent"
                ? <PaperAirplaneIcon className={`h-5 w-5 ${isActive ? "opacity-100" : "opacity-25"}`} />
                : <EnvelopeOpenIcon className={`h-5 w-5 ${isActive ? "opacity-100" : "opacity-25"}`} />}
              <span className={`text-[7px] font-bold tracking-widest ${isActive ? "opacity-100" : "opacity-25"}`}>
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
        <button onClick={fetchThreads} title="Sync"
          className={`mt-auto opacity-30 hover:opacity-100 transition-opacity ${loading ? "animate-spin" : ""}`}>
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ================================================================= */}
      {/* THREAD LIST                                                        */}
      {/* ================================================================= */}
      <div className={`w-full lg:w-72 border-r border-[#45CC2D]/20 flex flex-col bg-black flex-shrink-0
        ${showPane ? "hidden lg:flex" : "flex"}`}>
        <div className="px-3 py-3 border-b border-[#45CC2D]/20 bg-neutral-900/40 space-y-2 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest">{folder.toUpperCase()}</span>
            <span className="text-[8px] opacity-30">{filteredThreads.length} THREADS</span>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30" />
            <input type="text" placeholder="FILTER NODES..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black border border-[#45CC2D]/20 pl-7 pr-2 py-1.5 text-[9px] outline-none
                focus:border-[#45CC2D]/50 transition-colors placeholder-[#45CC2D]/20 uppercase tracking-widest" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="p-6 text-center text-[10px] opacity-30 animate-pulse uppercase">SCANNING...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-[10px] opacity-20 uppercase tracking-widest">NO TRANSMISSIONS</div>
          ) : filteredThreads.map(thread => {
            const latest = thread.messages[thread.messages.length - 1];
            const isActive = activeGuestId === thread.guest_id;
            const hasUnread = thread.unread_count > 0;
            return (
              <div key={thread.guest_id} onClick={() => openThread(thread)}
                className={`relative px-3 py-3 border-b border-[#45CC2D]/10 cursor-pointer transition-all group
                  ${isActive ? "bg-[#45CC2D]/10 border-l-2 border-l-[#45CC2D]" : "hover:bg-[#45CC2D]/5"}`}>
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
                <p className="text-[8px] opacity-20 truncate">{msgBody(latest).slice(0, 60)}</p>
                <div className="flex justify-between items-center mt-1.5">
                  {hasUnread
                    ? <span className="text-[7px] bg-[#45CC2D] text-black font-black px-1">{thread.unread_count} NEW</span>
                    : <span className="text-[7px] opacity-20">{thread.messages.length} MSG{thread.messages.length !== 1 ? "S" : ""}</span>}
                  <button onClick={e => { e.stopPropagation(); archiveThread(thread); }}
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity" title="Archive">
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* READING / COMPOSE PANE                                            */}
      {/* ================================================================= */}
      <div className={`flex-1 flex flex-col bg-neutral-900/5 overflow-hidden ${showPane ? "flex" : "hidden lg:flex"}`}>

        {/* ---- COMPOSE NEW MESSAGE ---- */}
        {composing && !activeGuestId && (
          <>
            <div className="shrink-0 px-4 py-3 border-b border-[#45CC2D]/20 flex items-center gap-3 bg-black">
              <button onClick={() => setComposing(false)} className="lg:hidden p-1 hover:bg-[#45CC2D]/10">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-xs font-black uppercase tracking-widest">NEW TRANSMISSION</span>
              <div className="ml-auto flex items-center gap-3">
                <DraftBadge saving={composeDraftSaving} saved={composeDraftSaved} />
                <button onClick={() => setComposing(false)} className="opacity-30 hover:opacity-100">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-4 lg:p-6 gap-3 overflow-y-auto scrollbar-hide">
              {/* TO + SUB fields */}
              <div className="border border-[#45CC2D]/20 bg-black">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#45CC2D]/10">
                  <span className="text-[9px] opacity-40 font-bold w-8 shrink-0">TO:</span>
                  <RecipientPicker
                    value={composeEmail}
                    confirmed={confirmedRecipients}
                    others={otherRecipients}
                    lookupState={composeLookupState}
                    onChange={v => { setComposeEmail(v); setComposeLookupState("idle"); setComposeGuestId(null); }}
                    onSelect={selectRecipient}
                    onLookup={lookupGuest}
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[9px] opacity-40 font-bold w-8 shrink-0">SUB:</span>
                  <input type="text" placeholder="SUBJECT_LINE" value={composeSubject}
                    onChange={e => { setComposeSubject(e.target.value); setComposeDraftSaved(false); }}
                    className="flex-1 bg-transparent outline-none text-[10px] uppercase tracking-widest" />
                </div>
              </div>

              {/* HTML Editor */}
              <HtmlEditor
                body={composeBody}
                isHtml={composeIsHtml}
                placeholder="ENTER TRANSMISSION..."
                onBodyChange={v => { setComposeBody(v); setComposeDraftSaved(false); }}
                onModeChange={setComposeIsHtml}
                minHeight="h-48 lg:h-64"
              />

              {sendError && (
                <p className="text-[9px] text-red-400 border border-red-500/30 px-2 py-1">{sendError}</p>
              )}

              <div className="flex items-center justify-between">
                <button onClick={saveComposeDraft}
                  disabled={composeDraftSaving || (!composeBody.trim() && !composeSubject.trim())}
                  className="flex items-center gap-1.5 border border-[#45CC2D]/30 px-3 py-1.5 text-[9px] font-bold uppercase
                    text-[#45CC2D]/60 hover:text-[#45CC2D] hover:border-[#45CC2D]/60 transition-all disabled:opacity-20">
                  <BookmarkIcon className="h-3 w-3" />
                  {composeDraftId ? "UPDATE DRAFT" : "SAVE DRAFT"}
                </button>
                <button onClick={sendNewMessage}
                  disabled={sending || !composeBody.trim() || composeLookupState !== "found"}
                  className="flex items-center gap-2 border border-[#45CC2D] px-5 py-2 text-[10px] font-bold uppercase
                    hover:bg-[#45CC2D] hover:text-black transition-all disabled:opacity-20">
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
                <button onClick={() => setActiveGuestId(null)} className="lg:hidden p-1 hover:bg-[#45CC2D]/10 shrink-0">
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm font-black uppercase tracking-tight truncate">{guestLabel(activeThread)}</h2>
                  <p className="text-[8px] opacity-40 truncate">
                    {guestEmail(activeThread)} // {threadSubject(activeThread)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:block text-[8px] opacity-20">
                  {activeThread.messages.length} MSG{activeThread.messages.length !== 1 ? "S" : ""}
                </span>
                <button onClick={() => archiveThread(activeThread)}
                  className="opacity-30 hover:opacity-100 transition-opacity p-1" title="Archive">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4 scrollbar-hide">
              {activeThread.messages.map(msg => {
                const isInbound = msg.type === "inbound_comm";
                const body = msgBody(msg);
                // Detect HTML in outbound messages (starts with < or contains HTML tags)
                const isHtmlContent = !isInbound && (body.trimStart().startsWith("<") || /<[a-z][\s\S]*>/i.test(body));
                return (
                  <div key={msg.id}
                    className={`flex flex-col max-w-[85%] lg:max-w-[70%] ${isInbound ? "self-start items-start" : "self-end items-end ml-auto"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {isInbound ? <UserIcon className="h-3 w-3 opacity-40" /> : <PaperAirplaneIcon className="h-3 w-3 opacity-40" />}
                      <span className="text-[7px] opacity-30 uppercase">
                        {isInbound ? "INBOUND" : "OUTBOUND"} // {relTime(msg.sent_at)}
                      </span>
                    </div>
                    <div className={`border ${isInbound ? "border-[#45CC2D]/30 bg-black text-[#45CC2D]" : "border-[#45CC2D]/15 bg-[#45CC2D]/5 text-[#45CC2D]/80"}`}>
                      {isHtmlContent ? (
                        <iframe
                          title={`msg-${msg.id}`}
                          srcDoc={body}
                          className="w-full min-h-[120px] border-none bg-white"
                          style={{ minWidth: "300px" }}
                          sandbox="allow-same-origin"
                        />
                      ) : (
                        <div className="px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap break-words">{body}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply composer */}
            <div className="shrink-0 border-t border-[#45CC2D]/20 bg-black px-4 lg:px-6 py-3 space-y-2">
              {/* Draft status */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] opacity-20 uppercase tracking-widest">REPLY</span>
                <DraftBadge saving={replyDraftSaving} saved={replyDraftSaved} />
              </div>

              <HtmlEditor
                body={replyBody}
                isHtml={replyIsHtml}
                placeholder="ENTER REPLY... (⌘↵ to send)"
                onBodyChange={v => { setReplyBody(v); setReplyDraftSaved(false); }}
                onModeChange={setReplyIsHtml}
                minHeight="h-28 lg:h-32"
                onKeyDown={handleReplyKeyDown}
              />

              {sendError && <p className="text-[9px] text-red-400">{sendError}</p>}

              <div className="flex items-center justify-between">
                <button onClick={saveReplyDraft}
                  disabled={replyDraftSaving || !replyBody.trim()}
                  className="flex items-center gap-1.5 border border-[#45CC2D]/30 px-3 py-1.5 text-[9px] font-bold uppercase
                    text-[#45CC2D]/60 hover:text-[#45CC2D] hover:border-[#45CC2D]/60 transition-all disabled:opacity-20">
                  <BookmarkIcon className="h-3 w-3" />
                  {replyDraftId ? "UPDATE DRAFT" : "SAVE DRAFT"}
                </button>
                <button onClick={sendReply} disabled={sending || !replyBody.trim()}
                  className="flex items-center gap-2 border border-[#45CC2D] px-5 py-2 text-[10px] font-bold uppercase
                    hover:bg-[#45CC2D] hover:text-black transition-all disabled:opacity-20">
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