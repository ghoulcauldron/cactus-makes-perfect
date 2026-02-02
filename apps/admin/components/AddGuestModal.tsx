import { useMemo, useState } from "react";


type Mode = "csv" | "single";

type ParsedGuest = {
  row: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  group_label?: string | null;
  valid: boolean;
  reason?: string;
};

type Props = {
  onClose: () => void;
  onConfirm: (guests: ParsedGuest[], options: {
    sendInvite: boolean;
    inviteTemplate: "default" | "friendly";
    subscribed: boolean;
  }) => void;
};

export default function AddGuestsModal({ onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>("csv");
  const [rawInput, setRawInput] = useState("");
  const [sendInvite, setSendInvite] = useState(false);
  const [inviteTemplate, setInviteTemplate] =
    useState<"default" | "friendly">("default");
  const [subscribed, setSubscribed] = useState(true);
  const [sending, setSending] = useState(false);

  function parseCSV(input: string): ParsedGuest[] {
    const lines = input
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (!lines.length) return [];

    const headers = lines[0].includes("@")
      ? ["email", "first_name", "last_name", "group"]
      : lines.shift()!.split(",").map(h => h.trim().toLowerCase());

    return lines.map((line, i) => {
      const values = line.split(",").map(v => v.trim());
      const row: any = { row: i + 1 };

      headers.forEach((h, idx) => (row[h] = values[idx]));

      if (!row.email || !row.email.includes("@")) {
        return {
          row: i + 1,
          email: row.email || "",
          valid: false,
          reason: "Invalid or missing email",
        };
      }

      return {
        row: i + 1,
        email: row.email.toLowerCase(),
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        phone: row.phone || "",
        group_label: canonicalizeGroupLabel(row.group || row.group_label),
        valid: true,
      };
    });
  }

  const parsedGuests = useMemo(() => parseCSV(rawInput), [rawInput]);
  const validGuests = parsedGuests.filter(g => g.valid);

  const canConfirm = validGuests.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[700px] rounded-lg bg-black shadow-2xl border border-[#45CC2D]/30 text-white flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold uppercase tracking-tight">
              Add Guests
            </h2>
            <p className="text-[11px] text-gray-500 uppercase">
              Paste CSV or add a single guest
            </p>
          </div>
          <button
            className="text-gray-500 hover:text-white text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">

          {/* Mode Toggle */}
          <div className="flex gap-4 text-xs uppercase font-bold">
            <button
              className={mode === "csv" ? "text-[#45CC2D]" : "text-gray-500"}
              onClick={() => setMode("csv")}
            >
              ● Paste CSV
            </button>
            <button
              className="text-gray-600 cursor-not-allowed"
              disabled
            >
              ○ Single Entry (soon)
            </button>
          </div>

          {/* CSV Input */}
          {mode === "csv" && (
            <>
              <textarea
                className="w-full h-[160px] bg-black border border-gray-800 text-white p-3 text-sm font-mono resize-none"
                placeholder="email,first_name,last_name,group&#10;jane@example.com,Jane,Doe,friends"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />

              {/* Preview */}
              <div className="border border-gray-800 rounded">
                <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-800">
                  Preview ({validGuests.length} valid)
                </div>

                <div className="max-h-[180px] overflow-y-auto">
                  {parsedGuests.map(g => (
                    <div
                      key={g.row}
                      className={`px-3 py-1 text-xs flex justify-between ${
                        g.valid ? "text-[#45CC2D]" : "text-red-400"
                      }`}
                    >
                      <span>{g.email || "(blank)"}</span>
                      <span className="opacity-60">
                        {g.valid ? g.group_label || "—" : g.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Options */}
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
              />
              Send invite immediately
            </label>

            {sendInvite && (
              <select
                className="bg-black border border-gray-800 text-white p-2 text-xs"
                value={inviteTemplate}
                onChange={(e) =>
                  setInviteTemplate(e.target.value as any)
                }
              >
                <option value="default">Standard Invite</option>
                <option value="friendly">Friendly Reminder</option>
              </select>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={subscribed}
                onChange={(e) => setSubscribed(e.target.checked)}
              />
              Subscribe guests to updates
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 bg-neutral-900/30">
          <div className="text-[10px] uppercase tracking-widest text-gray-500">
            {validGuests.length} guest{validGuests.length !== 1 ? "s" : ""} ready
          </div>

          <div className="flex items-center gap-3">
            <button
              className="text-xs uppercase text-gray-500 hover:text-white"
              onClick={onClose}
            >
              Abort
            </button>
            <button
              className={`px-6 py-2 text-sm font-bold uppercase rounded transition-all
                ${
                  canConfirm && !sending
                    ? "bg-[#45CC2D] text-black hover:scale-105"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              disabled={!canConfirm || sending}
              onClick={async () => {
                setSending(true);
                try {
                  await onConfirm(validGuests, {
                    sendInvite,
                    inviteTemplate,
                    subscribed,
                  });
                } finally {
                  setSending(false);
                }
              }}
            >
              {sending ? "Adding..." : "Confirm Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function canonicalizeGroupLabel(input?: string | null): string | null {
  const trimmed = (input || "").trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}