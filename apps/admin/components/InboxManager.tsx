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
  EnvelopeIcon,
  EnvelopeOpenIcon
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'emails_log' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- Logic: Threading (Aggregates Sent & Received) ---
  const threads = useMemo(() => {
    const groups: Record<string, any[]> = {};
    allLogs.forEach(log => {
      const key = log.guest?.id || log.meta?.from || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return groups;
  }, [allLogs]);

  // --- Logic: Badge Counts ---
  const unreadCount = useMemo(() => {
    return allLogs.filter(log => log.type === 'inbound_comm' && !log.is_read && log.folder_state === 'inbox').length;
  }, [allLogs]);

// --- Logic: Filtering ---
const filteredThreads = useMemo(() => {
  return Object.entries(threads).filter(([id, logs]) => {
    const lastLog = logs[0];
    const guestName = logs[0].guest ? `${logs[0].guest.first_name} ${logs[0].guest.last_name}`.toLowerCase() : "";
    const email = (logs[0].guest?.email || logs[0].meta?.from || "").toLowerCase();
    const subject = (lastLog.subject || "").toLowerCase();
    
    // 1. Determine Folder Membership
    let folderMatch = false;

    if (currentFolder === "trash") {
      // Show in Trash if the latest message is explicitly archived
      folderMatch = lastLog.is_archived === true;
    } else {
      // For all other folders, hide anything that is archived
      if (lastLog.is_archived === true) return false;

      if (currentFolder === "sent") {
        // Show in Sent if latest message is outbound
        folderMatch = (lastLog.type === "two_way_comm" || lastLog.type === "invite" || lastLog.type === "survey");
      } else if (currentFolder === "inbox") {
        // Show in Inbox if latest message is inbound
        folderMatch = lastLog.type === "inbound_comm";
      }
    }

    if (!folderMatch) return false;

    // 2. Search Logic
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return guestName.includes(q) || email.includes(q) || subject.includes(q);
  });
}, [threads, currentFolder, searchQuery]);

  const activeThread = selectedThreadId ? threads[selectedThreadId] : null;

  useEffect(() => {
    if (activeThread) {
      setIsComposingNew(false);
      const lastMsg = activeThread.find(m => m.type === 'inbound_comm') || activeThread[0];
      setEditSubject(`RE: ${lastMsg.subject.replace(/^RE:\s+/i, "")}`);
      setEditRecipient(lastMsg.guest?.email || lastMsg.meta?.from || "");
      setTargetGuestId(lastMsg.guest?.id || null);

      if (!activeThread[0].is_read && activeThread[0].type === 'inbound_comm') {
        toggleReadStatus([activeThread[0].id], true);
      }
    }
  }, [selectedThreadId]);

  const toggleReadStatus = async (ids: string[], isRead: boolean) => {
    await apiFetch("/admin/email/read-status", {
      method: "PATCH",
      body: JSON.stringify({ email_ids: ids, is_read: isRead })
    });
  };

  const startNewMessage = () => {
    setSelectedThreadId(null);
    setIsComposingNew(true);
    setEditSubject("");
    setEditRecipient("");
    setReplyText("");
  };

  const moveThreadToFolder = async (ids: string[], shouldArchive: boolean) => {
    await apiFetch("/admin/email/status", {
      method: "PATCH",
      body: JSON.stringify({ 
        email_ids: ids, 
        is_archived: shouldArchive 
      })
    });
    setSelectedThreadId(null);
    fetchData(); // Sync local state
  };

  const sendEmail = async () => {
    if (!replyText.trim()) return;
    let finalGuestId = targetGuestId;
    if (!finalGuestId && editRecipient) {
        const { data: guest } = await supabase.from("guests").select("id").eq("email", editRecipient.trim()).maybeSingle();
        finalGuestId = guest?.id || null;
    }
    if (!finalGuestId) return alert("ERROR: RECIPIENT NOT FOUND");

    try {
      await apiFetch("/admin/email/send", {
        method: "POST",
        body: JSON.stringify({
          guest_id: finalGuestId,
          subject: editSubject || "[SECURE TRANSMISSION]",
          text: replyText
        })
      });
      // Force immediate read-status on our own outbound
      setReplyText("");
      if (isComposingNew) setIsComposingNew(false);
      fetchData(); 
    } catch (error) {
      alert("CRITICAL: DISPATCH FAILED");
    }
  };

  return (
    <div className="h-full flex bg-black font-mono text-[#45CC2D]">
      
      {/* 1. Navigation Rail with Badges */}
      <div className="w-16 border-r border-[#45CC2D]/20 flex flex-col items-center py-6 gap-8 bg-neutral-900/20">
        <button onClick={startNewMessage} className="p-2 bg-[#45CC2D]/10 rounded-full hover:bg-[#45CC2D]/20 transition-all mb-4">
          <PlusIcon className="h-6 w-6" />
        </button>
        
        <button onClick={() => setCurrentFolder("inbox")} title="Inbox" className="relative">
          <InboxIcon className={`h-6 w-6 ${currentFolder === "inbox" ? "opacity-100" : "opacity-30"}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#45CC2D] text-black text-[8px] font-bold px-1 min-w-[14px] rounded-full shadow-[0_0_10px_#45CC2D]">
              {unreadCount}
            </span>
          )}
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
          <div className="relative">
            <MagnifyingGlassIcon className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 opacity-30" />
            <input 
              type="text"
              placeholder="FILTER_NODES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-[#45CC2D]/20 px-7 py-1.5 text-[10px] outline-none focus:border-[#45CC2D]/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredThreads.map(([id, logs]) => (
            <div 
              key={id} 
              onClick={() => setSelectedThreadId(id)}
              className={`p-4 border-b border-[#45CC2D]/10 hover:bg-[#45CC2D]/5 cursor-pointer relative ${selectedThreadId === id ? 'bg-[#45CC2D]/10' : ''}`}
            >
              {!logs[0].is_read && logs[0].type === 'inbound_comm' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#45CC2D] shadow-[2px_0_10px_#45CC2D]" />
              )}
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                <span className={!logs[0].is_read ? 'text-white' : ''}>
                    {logs[0].guest ? `${logs[0].guest.first_name} ${logs[0].guest.last_name}` : (logs[0].meta?.from || "Unknown")}
                </span>
                <span className="opacity-30 text-[8px]">{new Date(logs[0].sent_at).toLocaleDateString()}</span>
              </div>
              <p className={`text-[9px] truncate ${!logs[0].is_read ? 'text-[#45CC2D]' : 'opacity-40'}`}>
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
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold uppercase tracking-tighter">
                  {isComposingNew ? "New Transmission" : activeThread?.[0].subject}
                </h2>
                {!isComposingNew && (
                  <p className="text-[10px] opacity-40 uppercase">
                    Channel: {activeThread?.[0].meta?.from || activeThread?.[0].guest?.email}
                  </p>
                )}
              </div>
              
              {/* Header with Archive/Restore Controls */}
              {!isComposingNew && (
                <div className="flex gap-4">
                  <button 
                    onClick={() => moveThreadToFolder(
                      activeThread!.map(m => m.id), 
                      currentFolder !== 'trash' // If not in trash, archive it. If in trash, restore it.
                    )}
                    className="opacity-40 hover:opacity-100 transition-all p-2"
                    title={currentFolder === 'trash' ? "Restore to Inbox" : "Move to Trash"}
                  >
                    {currentFolder === 'trash' ? (
                      <span className="text-[10px] border border-[#45CC2D]/30 px-2 py-1 uppercase">Restore</span>
                    ) : (
                      <TrashIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide flex flex-col-reverse">
              {activeThread?.map((msg: any) => (
                <div key={msg.id} className={`max-w-xl ${msg.type === 'inbound_comm' ? 'self-start' : 'self-end text-right'}`}>
                  <div className="text-[7px] opacity-30 uppercase mb-1">
                    {msg.type === 'inbound_comm' ? 'Inbound' : 'Outbound'} // {new Date(msg.sent_at).toLocaleString()}
                  </div>
                  <div className={`p-4 text-xs leading-relaxed border ${msg.type === 'inbound_comm' ? 'border-[#45CC2D]/30 bg-black' : 'border-[#45CC2D]/10 bg-[#45CC2D]/5'}`}>
                    {msg.meta?.body || msg.text || "[No Content]"}
                  </div>
                </div>
              ))}
              {isComposingNew && <div className="flex-1 flex items-center justify-center opacity-20 text-[8px] italic">Awaiting Payload...</div>}
            </div>

            <div className="p-6 border-t border-[#45CC2D]/20 bg-black space-y-3">
              {(isComposingNew) && (
                <div className="flex flex-col gap-2 border-b border-[#45CC2D]/10 pb-3 text-[10px]">
                    <div className="flex gap-2">
                        <span className="opacity-40 w-12">TO:</span>
                        <input type="text" placeholder="GUEST_EMAIL" value={editRecipient} onChange={(e) => setEditRecipient(e.target.value)} className="bg-transparent outline-none flex-1" />
                    </div>
                    <div className="flex gap-2">
                        <span className="opacity-40 w-12">SUB:</span>
                        <input type="text" placeholder="SUBJECT_LINE" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="bg-transparent outline-none flex-1" />
                    </div>
                </div>
              )}
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full bg-transparent outline-none border-none text-xs h-32 resize-none text-[#45CC2D] placeholder-[#45CC2D]/20" placeholder="ENTER TRANSMISSION..." />
              <div className="flex justify-end">
                <button onClick={sendEmail} disabled={!replyText.trim() || (isComposingNew && !editRecipient)} className="flex items-center gap-2 border border-[#45CC2D] px-6 py-2 text-xs font-bold uppercase hover:bg-[#45CC2D] transition-all disabled:opacity-20">
                  <PaperAirplaneIcon className="h-4 w-4" /> Dispatch
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-[10px] tracking-[1em] uppercase">Select Node</div>
        )}
      </div>
    </div>
  );
}