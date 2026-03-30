// apps/admin/components/InboxManager.tsx
import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api/client";
import { createClient } from "@supabase/supabase-js";
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon, 
  InboxIcon, 
  PaperAirplaneIcon as SentIcon, 
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon, // Added for read status
  EnvelopeOpenIcon // Added for read status
} from '@heroicons/react/20/solid';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function InboxManager() {
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<"inbox" | "sent" | "trash">("inbox");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isComposingNew, setIsComposingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 
  
  const [replyText, setReplyText] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editRecipient, setEditRecipient] = useState("");
  const [targetGuestId, setTargetGuestId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/email/inbox");
      setAllLogs(res.messages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('inbox-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emails_log' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const threads = useMemo(() => {
    const groups: Record<string, any[]> = {};
    allLogs.forEach(log => {
      const key = log.guest?.id || log.meta?.from || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return groups;
  }, [allLogs]);

  const filteredThreads = useMemo(() => {
    return Object.entries(threads).filter(([id, logs]) => {
      const lastLog = logs[0];
      const guestName = logs[0].guest ? `${logs[0].guest.first_name} ${logs[0].guest.last_name}`.toLowerCase() : "";
      const email = (logs[0].guest?.email || logs[0].meta?.from || "").toLowerCase();
      const subject = (logs[0].subject || "").toLowerCase();
      
      let folderMatch = false;
      if (currentFolder === "trash") folderMatch = lastLog.folder_state === "trash";
      else if (currentFolder === "sent") folderMatch = lastLog.type === "two_way_comm" && lastLog.folder_state !== "trash";
      else folderMatch = lastLog.type === "inbound_comm" && lastLog.folder_state !== "trash";

      if (!folderMatch) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return guestName.includes(q) || email.includes(q) || subject.includes(q);
    });
  }, [threads, currentFolder, searchQuery]);

  const activeThread = selectedThreadId ? threads[selectedThreadId] : null;

  // Mark as Read Logic
  useEffect(() => {
    if (activeThread) {
      setIsComposingNew(false);
      const lastMsg = activeThread[0];
      setEditSubject(`RE: ${lastMsg.subject.replace(/^RE:\s+/i, "")}`);
      setEditRecipient(lastMsg.guest?.email || lastMsg.meta?.from || "");
      setTargetGuestId(lastMsg.guest?.id || null);

      // Auto-mark as read if the latest message is unread
      if (!lastMsg.is_read) {
        toggleReadStatus(activeThread.map(m => m.id), true);
      }
    }
  }, [selectedThreadId]);

  const toggleReadStatus = async (ids: string[], isRead: boolean) => {
    await apiFetch("/admin/email/read-status", {
      method: "PATCH",
      body: JSON.stringify({ email_ids: ids, is_read: isRead })
    });
    fetchData(); // Sync local state
  };

  const startNewMessage = () => {
    setSelectedThreadId(null);
    setIsComposingNew(true);
    setEditSubject("");
    setEditRecipient("");
    setReplyText("");
    setTargetGuestId(null);
  };

  const moveThreadToFolder = async (ids: string[], newState: string) => {
    await apiFetch("/admin/email/status", {
      method: "PATCH",
      body: JSON.stringify({ email_ids: ids, folder_state: newState })
    });
    setSelectedThreadId(null);
    fetchData();
  };

  const sendEmail = async () => {
    if (!replyText.trim()) return;
    let finalGuestId = targetGuestId;
    if (!finalGuestId && editRecipient) {
        const { data: guest } = await supabase.from("guests").select("id").eq("email", editRecipient.trim()).maybeSingle();
        finalGuestId = guest?.id || null;
    }
    if (!finalGuestId) {
      alert("ERROR: RECIPIENT NOT FOUND");
      return;
    }
    try {
      await apiFetch("/admin/email/send", {
        method: "POST",
        body: JSON.stringify({
          guest_id: finalGuestId,
          subject: editSubject || "[SECURE TRANSMISSION]",
          text: replyText
        })
      });
      setReplyText("");
      if (isComposingNew) setIsComposingNew(false);
      fetchData(); 
      alert("TRANSMISSION DISPATCHED");
    } catch (error) {
      alert("CRITICAL: DISPATCH FAILED");
    }
  };

  return (
    <div className="h-full flex bg-black font-mono text-[#45CC2D]">
      
      {/* 1. Navigation Rail */}
      <div className="w-16 border-r border-[#45CC2D]/20 flex flex-col items-center py-6 gap-8 bg-neutral-900/20">
        <button onClick={startNewMessage} className="p-2 bg-[#45CC2D]/10 rounded-full hover:bg-[#45CC2D]/20 transition-all mb-4">
          <PlusIcon className="h-6 w-6" />
        </button>
        <button onClick={() => setCurrentFolder("inbox")} title="Inbox">
          <InboxIcon className={`h-6 w-6 ${currentFolder === "inbox" ? "opacity-100" : "opacity-30"}`} />
        </button>
        <button onClick={() => setCurrentFolder("sent")} title="Sent">
          <SentIcon className={`h-6 w-6 ${currentFolder === "sent" ? "opacity-100" : "opacity-30"}`} />
        </button>
        <button onClick={() => setCurrentFolder("trash")} title="Trash">
          <TrashIcon className={`h-6 w-6 ${currentFolder === "trash" ? "opacity-100" : "opacity-30"}`} />
        </button>
      </div>

      {/* 2. Thread List */}
      <div className="w-80 border-r border-[#45CC2D]/30 flex flex-col bg-black">
        <div className="p-4 border-b border-[#45CC2D]/30 space-y-3 bg-neutral-900/40">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest">{currentFolder}</span>
            <button onClick={fetchData} className={loading ? "animate-spin" : ""}><ArrowPathIcon className="h-4 w-4" /></button>
          </div>
          <div className="relative group">
            <MagnifyingGlassIcon className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100" />
            <input 
              type="text"
              placeholder="FILTER_NODES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-[#45CC2D]/20 px-7 py-1.5 text-[10px] outline-none focus:border-[#45CC2D]/50 transition-colors placeholder:opacity-20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredThreads.map(([id, logs]) => (
            <div 
              key={id} 
              onClick={() => setSelectedThreadId(id)}
              className={`p-4 border-b border-[#45CC2D]/10 hover:bg-[#45CC2D]/5 cursor-pointer relative transition-all ${selectedThreadId === id ? 'bg-[#45CC2D]/10' : ''}`}
            >
              {/* Unread Indicator */}
              {!logs[0].is_read && logs[0].type === 'inbound_comm' && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#45CC2D] shadow-[0_0_10px_#45CC2D]" />
              )}
              
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                <span className={`truncate ${!logs[0].is_read ? 'text-white' : ''}`}>
                    {logs[0].guest ? `${logs[0].guest.first_name} ${logs[0].guest.last_name}` : (logs[0].meta?.from || "Unknown")}
                </span>
                <span className="opacity-30 font-normal text-[8px]">{new Date(logs[0].sent_at).toLocaleDateString()}</span>
              </div>
              <p className={`text-[9px] truncate ${!logs[0].is_read ? 'opacity-100 text-[#45CC2D]' : 'opacity-40'}`}>
                {logs[0].subject}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Reading Pane */}
      <div className="flex-1 flex flex-col bg-neutral-900/5 overflow-hidden">
        {(activeThread || isComposingNew) ? (
          <>
            <div className="p-6 border-b border-[#45CC2D]/10 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tighter mb-1">
                  {isComposingNew ? "New Transmission" : activeThread?.[0].subject}
                </h2>
                {!isComposingNew && (
                  <p className="text-[10px] opacity-40 uppercase">
                    Node: {activeThread?.[0].meta?.from || activeThread?.[0].guest?.email}
                  </p>
                )}
              </div>
              {!isComposingNew && (
                <div className="flex gap-4">
                  {/* Mark as Unread Toggle */}
                  <button 
                    onClick={() => toggleReadStatus(activeThread!.map(m => m.id), !activeThread![0].is_read)}
                    className="opacity-40 hover:opacity-100 transition-all p-2"
                    title={activeThread[0].is_read ? "Mark as Unread" : "Mark as Read"}
                  >
                    {activeThread[0].is_read ? <EnvelopeIcon className="h-5 w-5" /> : <EnvelopeOpenIcon className="h-5 w-5" />}
                  </button>
                  <button 
                    onClick={() => moveThreadToFolder(activeThread!.map(m => m.id), currentFolder === 'trash' ? 'inbox' : 'trash')}
                    className="opacity-40 hover:opacity-100 transition-all p-2"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {activeThread?.slice().reverse().map((msg: any) => (
                <div key={msg.id} className={`max-w-xl ${msg.type === 'inbound_comm' ? 'mr-auto' : 'ml-auto text-right'}`}>
                  <div className="text-[8px] opacity-30 uppercase mb-2">
                    {msg.type === 'inbound_comm' ? 'Inbound Transmission' : 'Outbound Dispatch'} // {new Date(msg.sent_at).toLocaleString()}
                  </div>
                  <div className={`p-4 text-xs leading-relaxed border ${
                    msg.type === 'inbound_comm' ? 'border-[#45CC2D]/30 bg-black' : 'border-[#45CC2D]/10 bg-[#45CC2D]/5'
                  }`}>
                    {msg.meta?.body || msg.text || "[Empty Transmission]"}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-[#45CC2D]/20 bg-black space-y-3">
              {(isComposingNew) && (
                <div className="flex flex-col gap-2 border-b border-[#45CC2D]/10 pb-3">
                  <div className="flex items-center text-[10px] gap-2">
                    <span className="opacity-40 w-12">TO:</span>
                    <input type="text" placeholder="guest@email.com" value={editRecipient} onChange={(e) => setEditRecipient(e.target.value)} className="bg-transparent outline-none flex-1 text-[#45CC2D]" />
                  </div>
                  <div className="flex items-center text-[10px] gap-2">
                    <span className="opacity-40 w-12">SUBJ:</span>
                    <input type="text" placeholder="SUBJECT" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="bg-transparent outline-none flex-1 text-[#45CC2D]" />
                  </div>
                </div>
              )}
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full bg-transparent outline-none border-none text-xs h-32 resize-none text-[#45CC2D] placeholder-[#45CC2D]/20 leading-relaxed" placeholder={isComposingNew ? "START NEW TRANSMISSION..." : "REPLY TO NODE..."} />
              <div className="flex justify-end mt-2">
                <button onClick={sendEmail} disabled={!replyText.trim() || (isComposingNew && !editRecipient)} className="flex items-center gap-2 border border-[#45CC2D] px-6 py-2 text-xs font-bold uppercase hover:bg-[#45CC2D] hover:text-black transition-all disabled:opacity-20">
                  <PaperAirplaneIcon className="h-4 w-4" /> Dispatch Signal
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-[10px] tracking-[1em] uppercase">
            <div className="mb-4 text-2xl">⎐</div>
            Select Node or Start New
          </div>
        )}
      </div>
    </div>
  );
}