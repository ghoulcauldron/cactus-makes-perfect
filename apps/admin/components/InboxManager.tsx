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
  ChevronRightIcon
} from '@heroicons/react/20/solid';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function InboxManager() {
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<"inbox" | "sent" | "trash">("inbox");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all email logs to build the local state
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

  // --- Logic: Threading ---
  // Groups all logs by the guest or the email address
  const threads = useMemo(() => {
    const groups: Record<string, any[]> = {};
    allLogs.forEach(log => {
      const key = log.guest?.id || log.meta?.from || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return groups;
  }, [allLogs]);

  // --- Logic: Filtering by Folder ---
  const filteredThreads = useMemo(() => {
    return Object.entries(threads).filter(([_, logs]) => {
      const lastLog = logs[0]; // sorted by sent_at desc in backend
      if (currentFolder === "inbox") return lastLog.type === "inbound_comm";
      if (currentFolder === "sent") return lastLog.type === "two_way_comm" || lastLog.type === "invite";
      return false;
    });
  }, [threads, currentFolder]);

  const activeThread = selectedThreadId ? threads[selectedThreadId] : null;

  return (
    <div className="h-full flex bg-black font-mono text-[#45CC2D]">
      
      {/* 1. Navigation Rail (Folders) */}
      <div className="w-16 border-r border-[#45CC2D]/20 flex flex-col items-center py-6 gap-8 bg-neutral-900/20">
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
        <div className="p-4 border-b border-[#45CC2D]/30 flex justify-between items-center bg-neutral-900/40">
          <span className="text-[10px] font-bold uppercase tracking-widest">{currentFolder}</span>
          <button onClick={fetchData} className={loading ? "animate-spin" : ""}><ArrowPathIcon className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredThreads.map(([id, logs]) => (
            <div 
              key={id} 
              onClick={() => setSelectedThreadId(id)}
              className={`p-4 border-b border-[#45CC2D]/10 hover:bg-[#45CC2D]/5 cursor-pointer ${selectedThreadId === id ? 'bg-[#45CC2D]/10' : ''}`}
            >
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                <span className="truncate">{logs[0].guest ? `${logs[0].guest.first_name} ${logs[0].guest.last_name}` : (logs[0].meta?.from || "Unknown")}</span>
                <span className="opacity-30 font-normal">{new Date(logs[0].sent_at).toLocaleDateString()}</span>
              </div>
              <p className="text-[9px] opacity-40 truncate">{logs[0].subject}</p>
              <p className="text-[8px] opacity-20 truncate mt-1 italic">"{logs[0].meta?.body?.substring(0, 40)}..."</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Reading Pane (Thread View) */}
      <div className="flex-1 flex flex-col bg-neutral-900/5 overflow-hidden">
        {activeThread ? (
          <>
            <div className="p-6 border-b border-[#45CC2D]/10">
              <h2 className="text-xl font-bold uppercase tracking-tighter mb-1">{activeThread[0].subject}</h2>
              <p className="text-[10px] opacity-40 uppercase">Node: {activeThread[0].meta?.from}</p>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {activeThread.slice().reverse().map((msg: any) => (
                <div key={msg.id} className={`max-w-xl ${msg.type === 'inbound_comm' ? 'mr-auto' : 'ml-auto text-right'}`}>
                  <div className="text-[8px] opacity-30 uppercase mb-2">
                    {msg.type === 'inbound_comm' ? 'Inbound Transmission' : 'Outbound Dispatch'} // {new Date(msg.sent_at).toLocaleString()}
                  </div>
                  <div className={`p-4 text-xs leading-relaxed border ${msg.type === 'inbound_comm' ? 'border-[#45CC2D]/30 bg-black' : 'border-[#45CC2D]/10 bg-[#45CC2D]/5'}`}>
                    {msg.meta?.body || msg.text || "[Empty Transmission]"}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Terminal */}
            <div className="p-6 border-t border-[#45CC2D]/20 bg-black">
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-transparent outline-none border-none text-xs h-24 resize-none text-[#45CC2D] placeholder-[#45CC2D]/20"
                placeholder="REPLY TO NODE..."
              />
              <div className="flex justify-end mt-4">
                <button onClick={() => {}} className="flex items-center gap-2 border border-[#45CC2D] px-6 py-2 text-xs font-bold uppercase hover:bg-[#45CC2D] hover:text-black transition-all">
                  <PaperAirplaneIcon className="h-4 w-4" /> Dispatch
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-10 text-[10px] tracking-[1em] uppercase">Select Thread</div>
        )}
      </div>
    </div>
  );
}