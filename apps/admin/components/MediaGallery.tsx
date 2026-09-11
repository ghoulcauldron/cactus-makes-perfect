import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetch } from "../api/client";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface MediaRow {
  id: string;
  kind: "image" | "video";
  status: string;
  thumb_url: string | null;
  display_url: string | null;
  original_url: string | null;
  taken_at: string | null;
  filename: string | null;
  duration_s: number | null;
  guest_id: string;
  guest_name: string;
  source: string;
  uploaded_at: string;
}

interface Contributor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  upload_count: number;
  image_count: number;
  video_count: number;
  last_upload_at: string | null;
  artifact_token: string | null;
}

type SortMode = "uploaded" | "taken";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function relTime(d: string | null): string {
  if (!d) return "—";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "NOW";
  if (m < 60) return `${m}M`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}D`;
  return new Date(d).toLocaleDateString();
}

function fullName(c: Contributor) {
  return `${c.first_name} ${c.last_name}`;
}

// ---------------------------------------------------------------------------
// LIGHTBOX
// ---------------------------------------------------------------------------
function Lightbox({
  items, index, onClose, onNav,
}: {
  items: MediaRow[];
  index: number;
  onClose: () => void;
  onNav: (dir: -1 | 1) => void;
}) {
  const m = items[index];
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  if (!m) return null;

  return (
    <div
      className="fixed inset-0 z-[12000] bg-black/95 backdrop-blur-sm font-mono flex flex-col"
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 60) onNav(dx > 0 ? -1 : 1);
        touchX.current = null;
      }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#45CC2D]/20">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#45CC2D] truncate">
            {m.guest_name}
          </p>
          <p className="text-[8px] opacity-40 truncate text-[#45CC2D]">
            {m.filename || "UNTITLED"} // {m.source.toUpperCase()} // {relTime(m.uploaded_at)} AGO
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <span className="text-[8px] text-[#45CC2D]/40 tracking-widest">
            {String(index + 1).padStart(3, "0")} / {String(items.length).padStart(3, "0")}
          </span>
          <a href={m.original_url || "#"} download target="_blank" rel="noreferrer"
            className="text-[#45CC2D]/40 hover:text-[#45CC2D] transition-colors" title="Download original">
            <ArrowDownTrayIcon className="h-4 w-4" />
          </a>
          <button onClick={onClose} className="text-[#45CC2D]/40 hover:text-[#45CC2D] transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        {items.length > 1 && (
          <>
            <button onClick={() => onNav(-1)}
              className="absolute left-3 z-10 p-3 border border-[#45CC2D]/20 bg-black/60
                text-[#45CC2D]/40 hover:text-[#45CC2D] hover:border-[#45CC2D]/60 transition-all">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button onClick={() => onNav(1)}
              className="absolute right-3 z-10 p-3 border border-[#45CC2D]/20 bg-black/60
                text-[#45CC2D]/40 hover:text-[#45CC2D] hover:border-[#45CC2D]/60 transition-all">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        {m.kind === "video" ? (
          <video key={m.id} src={m.original_url || ""} controls autoPlay
            className="max-w-full max-h-full border border-[#45CC2D]/20" />
        ) : (
          <img key={m.id} src={m.display_url || ""} alt=""
            className="max-w-full max-h-full object-contain border border-[#45CC2D]/20" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
export default function MediaGallery() {
  const [media, setMedia]               = useState<MediaRow[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeGuest, setActiveGuest]   = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [kindFilter, setKindFilter]     = useState<"all" | "image" | "video">("all");
  const [sortMode, setSortMode]         = useState<SortMode>("uploaded");
  const [lbIndex, setLbIndex]           = useState<number | null>(null);
  const [showRail, setShowRail]         = useState(true);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/media");
      setMedia(res.media || []);
      setContributors(res.contributors || []);
    } catch (e) {
      console.error("[MediaGallery] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const filtered = useMemo(() => {
    let list = media;
    if (activeGuest) list = list.filter(m => m.guest_id === activeGuest);
    if (kindFilter !== "all") list = list.filter(m => m.kind === kindFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        (m.filename || "").toLowerCase().includes(q) ||
        m.guest_name.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = sortMode === "taken" ? (a.taken_at || a.uploaded_at) : a.uploaded_at;
      const bv = sortMode === "taken" ? (b.taken_at || b.uploaded_at) : b.uploaded_at;
      return new Date(bv).getTime() - new Date(av).getTime();
    });
  }, [media, activeGuest, kindFilter, search, sortMode]);

  const totals = useMemo(() => ({
    all:    media.length,
    images: media.filter(m => m.kind === "image").length,
    videos: media.filter(m => m.kind === "video").length,
    people: contributors.filter(c => c.upload_count > 0).length,
  }), [media, contributors]);

  const navLightbox = useCallback((dir: -1 | 1) => {
    setLbIndex(i => {
      if (i === null || filtered.length === 0) return i;
      return (i + dir + filtered.length) % filtered.length;
    });
  }, [filtered.length]);

  const activeName = activeGuest
    ? contributors.find(c => c.id === activeGuest)
    : null;

  return (
    <div className="h-full flex bg-black font-mono text-[#45CC2D] overflow-hidden">

      {/* ============================================================= */}
      {/* CONTRIBUTOR RAIL                                              */}
      {/* ============================================================= */}
      <div className={`${showRail ? "w-64" : "w-0"} transition-all duration-300
        border-r border-[#45CC2D]/20 flex flex-col bg-neutral-900/20 shrink-0 overflow-hidden`}>

        <div className="px-3 py-3 border-b border-[#45CC2D]/20 bg-neutral-900/40 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">CONTRIBUTORS</span>
            <span className="text-[8px] opacity-30">{totals.people} ACTIVE</span>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30" />
            <input type="text" placeholder="FILTER..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black border border-[#45CC2D]/20 pl-7 pr-2 py-1.5 text-[9px]
                outline-none focus:border-[#45CC2D]/50 transition-colors
                placeholder-[#45CC2D]/20 uppercase tracking-widest" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* All */}
          <button onClick={() => { setActiveGuest(null); setLbIndex(null); }}
            className={`w-full text-left px-3 py-3 border-b border-[#45CC2D]/10 transition-all
              ${!activeGuest ? "bg-[#45CC2D]/10 border-l-2 border-l-[#45CC2D]" : "hover:bg-[#45CC2D]/5"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase flex items-center gap-1.5">
                <UsersIcon className="h-3 w-3" /> ALL IMPRINTS
              </span>
              <span className="text-[9px] text-[#45CC2D]">{totals.all}</span>
            </div>
            <p className="text-[7px] opacity-30 mt-1">
              {totals.images} IMG // {totals.videos} VID
            </p>
          </button>

          {contributors
            .filter(c => !search.trim() || fullName(c).toLowerCase().includes(search.toLowerCase()))
            .map(c => {
              const isActive = activeGuest === c.id;
              const hasUploads = c.upload_count > 0;
              return (
                <button key={c.id}
                  onClick={() => { setActiveGuest(c.id); setLbIndex(null); }}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#45CC2D]/10 transition-all
                    ${isActive ? "bg-[#45CC2D]/10 border-l-2 border-l-[#45CC2D]" : "hover:bg-[#45CC2D]/5"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase truncate
                      ${hasUploads ? "text-[#45CC2D]" : "text-[#45CC2D]/25"}`}>
                      {fullName(c)}
                    </span>
                    <span className={`text-[9px] shrink-0 ${hasUploads ? "text-[#45CC2D]" : "opacity-20"}`}>
                      {c.upload_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[7px] opacity-25 truncate">
                      {hasUploads ? `${c.image_count} IMG // ${c.video_count} VID` : "NO SIGNAL"}
                    </span>
                    {c.last_upload_at && (
                      <span className="text-[7px] opacity-25 shrink-0">{relTime(c.last_upload_at)}</span>
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* GALLERY                                                        */}
      {/* ============================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="shrink-0 px-4 py-3 border-b border-[#45CC2D]/20 bg-black
          flex items-center gap-3 flex-wrap">

          <button onClick={() => setShowRail(r => !r)}
            className="p-1 opacity-30 hover:opacity-100 transition-opacity" title="Toggle contributors">
            <ChevronLeftIcon className={`h-4 w-4 transition-transform ${showRail ? "" : "rotate-180"}`} />
          </button>

          <div className="min-w-0">
            <h2 className="text-xs font-black uppercase tracking-tight truncate">
              {activeName ? fullName(activeName) : "FULL ARCHIVE"}
            </h2>
            <p className="text-[8px] opacity-40">
              {filtered.length} SHOWN
              {activeName?.email && ` // ${activeName.email}`}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Kind filter */}
            {(["all", "image", "video"] as const).map(k => (
              <button key={k} onClick={() => setKindFilter(k)}
                className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest transition-all
                  ${kindFilter === k ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]/40 hover:text-[#45CC2D]"}`}>
                {k === "all" ? "ALL" : k === "image" ? "IMG" : "VID"}
              </button>
            ))}

            <span className="opacity-20 text-[8px]">|</span>

            {/* Sort */}
            <button onClick={() => setSortMode(s => s === "uploaded" ? "taken" : "uploaded")}
              className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest
                border border-[#45CC2D]/20 hover:border-[#45CC2D]/60 transition-all">
              BY {sortMode === "uploaded" ? "UPLOAD" : "CAPTURE"}
            </button>

            <button onClick={fetchMedia}
              className={`p-1 opacity-30 hover:opacity-100 transition-opacity ${loading ? "animate-spin" : ""}`}
              title="Sync">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          {loading ? (
            <div className="py-20 text-center text-[10px] opacity-30 animate-pulse uppercase tracking-widest">
              SCANNING ARCHIVE...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-[10px] opacity-20 uppercase tracking-widest">
              NO IMPRINTS DETECTED
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filtered.map((m, i) => (
                <button key={`${m.id}-${m.guest_id}`} onClick={() => setLbIndex(i)}
                  className="group relative aspect-square bg-neutral-900 border border-[#45CC2D]/15
                    hover:border-[#45CC2D]/60 overflow-hidden transition-all">
                  {m.kind === "video" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#45CC2D]/40">
                      <VideoCameraIcon className="h-6 w-6" />
                      <span className="text-[7px] tracking-widest">VID</span>
                    </div>
                  ) : m.thumb_url ? (
                    <img src={m.thumb_url} loading="lazy" alt=""
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#45CC2D]/20">
                      <PhotoIcon className="h-5 w-5" />
                    </div>
                  )}

                  {/* Attribution overlay — only in ALL view */}
                  {!activeGuest && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-1 py-0.5
                      opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[6px] uppercase tracking-wider truncate text-[#45CC2D]">
                        {m.guest_name}
                      </p>
                    </div>
                  )}

                  {m.source !== "portal" && (
                    <span className="absolute top-0.5 right-0.5 bg-[#45CC2D] text-black
                      text-[6px] font-black px-1 uppercase">
                      {m.source.slice(0, 2)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lbIndex !== null && filtered[lbIndex] && (
        <Lightbox
          items={filtered}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onNav={navLightbox}
        />
      )}
    </div>
  );
}