// apps/admin/components/InboxManager.tsx
import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { createClient } from "@supabase/supabase-js"; // Direct import
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/20/solid';

// Initialize client directly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // USE ANON KEY HERE
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function InboxManager() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  const refreshInbox = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/email/inbox");
      setMessages(res.messages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInbox();

    // Listen for NEW inbound messages in the database
    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'emails_log', 
          filter: 'type=eq.inbound_comm' 
        }, 
        () => {
          // Unused 'payload' removed to fix ts(6133)
          console.log('New message detected, syncing...');
          refreshInbox(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendReply = async () => {
    if (!selectedGuest || !replyText) return;
    await apiFetch("/admin/email/send", {
      method: "POST",
      body: JSON.stringify({
        guest_id: selectedGuest.id,
        subject: "RE: COORDINATES",
        text: replyText
      })
    });
    setReplyText("");
    alert("TRANSMISSION SENT");
  };

  return (
    <div className="h-full flex bg-black font-mono text-[#45CC2D]">
      {/* Sidebar: Message List */}
      <div className="w-80 border-r border-[#45CC2D]/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-[#45CC2D]/30 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest">Incoming Traffic</span>
          <button onClick={refreshInbox}>
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              onClick={() => setSelectedGuest(msg.guest)} 
              className={`p-4 border-b border-[#45CC2D]/10 hover:bg-[#45CC2D]/5 cursor-pointer transition-colors ${selectedGuest?.id === msg.guest?.id ? 'bg-[#45CC2D]/10' : ''}`}
            >
              <div className="text-[10px] font-bold uppercase truncate">
                {msg.guest ? `${msg.guest.first_name} ${msg.guest.last_name}` : (msg.meta?.from || "Unknown Node")}
              </div>
              <div className="text-[9px] opacity-40 truncate">{msg.subject}</div>
              <div className="text-[7px] opacity-20 uppercase mt-1">
                {new Date(msg.sent_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Thread & Reply */}
      <div className="flex-1 flex flex-col p-8 bg-neutral-900/10">
        {selectedGuest ? (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold uppercase tracking-tighter">
              Secure Line: {selectedGuest.first_name}
            </h2>
            <div className="border border-[#45CC2D]/30 bg-black p-4 min-h-[200px] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <p className="text-[10px] opacity-40 uppercase mb-4 font-bold tracking-widest">
                // System ready for outbound relay...
              </p>
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-transparent outline-none border-none text-xs h-40 resize-none text-[#45CC2D] placeholder-[#45CC2D]/20"
                placeholder="ENTER ENCRYPTED MESSAGE..."
              />
            </div>
            <button 
              onClick={sendReply}
              className="flex items-center gap-2 border border-[#45CC2D] px-6 py-2 text-xs font-bold uppercase hover:bg-[#45CC2D] hover:text-black transition-all active:scale-95"
            >
              <PaperAirplaneIcon className="h-4 w-4" /> Dispatch Message
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-20 uppercase text-xs tracking-[0.5em] animate-pulse">
            Select Node to begin comms
          </div>
        )}
      </div>
    </div>
  );
}