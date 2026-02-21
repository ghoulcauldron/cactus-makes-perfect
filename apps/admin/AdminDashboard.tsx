import React, { useState } from "react";
import GuestList from "./components/GuestList";
import LodgingManager from "./components/LodgingManager"; // Points to your shared scaffold
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

type Tab = "GUESTS" | "LODGING";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("GUESTS");

  const tabs: { id: Tab; label: string }[] = [
    { id: "GUESTS", label: "GUEST LIST" },
    { id: "LODGING", label: "LODGING MGMT" }
  ];

  return (
    <div className="flex flex-col h-screen sm:h-dvh bg-surface text-primary font-mono border-4 border-primary overflow-hidden relative">
      {/* GLOBAL HEADER */}
      <div className="shrink-0 px-3 py-1 border-b border-primary bg-surface uppercase tracking-widest text-sm w-full z-40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 sm:gap-8">
            <span className="truncate mr-2 font-bold text-[#45CC2D] text-xs sm:text-sm">AREA 51</span>
            
            {/* DESKTOP TAB NAVIGATOR (Hidden on Mobile) */}
            <nav className="hidden sm:flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-0.5 text-[10px] font-bold border transition-all ${
                    activeTab === tab.id 
                      ? "bg-[#45CC2D] text-black border-[#45CC2D]" 
                      : "text-[#45CC2D]/40 border-transparent hover:border-[#45CC2D]/40 hover:text-[#45CC2D]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* MOBILE TAB DROPDOWN (Shown on Mobile only) */}
            <div className="sm:hidden relative w-32">
              <Listbox value={activeTab} onChange={setActiveTab}>
                <ListboxButton className="relative w-full border border-[#45CC2D] bg-black py-1 pl-2 pr-8 text-left text-[10px] font-bold uppercase text-[#45CC2D]">
                  <span className="block truncate">
                    {tabs.find(t => t.id === activeTab)?.label.split(' ')[0]}...
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </ListboxButton>
                <ListboxOptions className="absolute right-0 z-50 mt-1 max-h-60 w-40 overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                  {tabs.map((tab) => (
                    <ListboxOption
                      key={tab.id}
                      value={tab.id}
                      className={({ active }) => `relative cursor-pointer select-none py-2 px-4 text-[10px] font-bold uppercase transition-colors ${
                        active ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]"
                      }`}
                    >
                      {tab.label}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            </div>

            <button 
              className="shrink-0 px-2 py-1 border border-primary text-primary hover:bg-[#9ae68c] hover:text-surface transition-colors text-[10px] font-bold uppercase" 
              onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/login"; }}
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* VIEW CONTROLLER */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "GUESTS" && <GuestList />}
        {activeTab === "LODGING" && <LodgingManager />}
      </div>
    </div>
  );
}