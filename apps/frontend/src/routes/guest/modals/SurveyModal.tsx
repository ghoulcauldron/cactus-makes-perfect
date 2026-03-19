import { useState } from "react";

export default function SurveyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setSelections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isOpen) return null;

  const Block = ({
    label,
    id,
  }: {
    label: string;
    id: string;
  }) => {
    const active = selections[id];

    return (
      <button
        onClick={() => toggle(id)}
        className={`
          w-full text-left border border-[#45CC2D] px-4 py-3 mb-3
          font-mono text-sm tracking-wide
          transition-all duration-150
          
          ${active
            ? "bg-[#45CC2D] text-black glow-neon"
            : "bg-black text-[#45CC2D] hover:bg-[#0a0a0a]"}
        `}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center">
      <div className="w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto border-2 border-[#45CC2D] bg-black text-[#45CC2D] p-6 font-mono">

        {/* HEADER */}
        <div className="mb-6">
          <p className="text-xs tracking-[0.3em] mb-2 opacity-70">
            /// AREA 51: COORDINATE CONFIRMATION ///
          </p>
          <h2 className="text-lg font-bold">
            SELECT YOUR TRAJECTORY
          </h2>
        </div>

        {/* THURSDAY */}
        <div className="mb-6">
          <p className="text-xs opacity-70 mb-2">THURSDAY, AUGUST 27</p>
          <Block id="thursday_arrival" label="ARRIVING ON THIS DATE" />
        </div>

        {/* FRIDAY */}
        <div className="mb-6">
          <p className="text-xs opacity-70 mb-2">FRIDAY, AUGUST 28</p>
          <Block id="friday_meowwolf" label="MIDDAY: OFF-WORLD EXCURSION (OPTIONAL)" />
          <Block id="friday_dinner" label="EVENING: DINNER — 6PM (MAIN EVENT)" />
        </div>

        {/* SATURDAY */}
        <div className="mb-6">
          <p className="text-xs opacity-70 mb-2">SATURDAY, AUGUST 29</p>
          <Block id="saturday_railway" label="EVENING: SKY RAILWAY TRANSPORT — 6PM" />
        </div>

        {/* SUNDAY */}
        <div className="mb-6">
          <p className="text-xs opacity-70 mb-2">SUNDAY, AUGUST 30</p>
          <Block id="sunday_brunch" label="MIDDAY: BRUNCH" />
          <Block id="sunday_movie" label="EVENING: FINAL TRANSMISSION + CINEMA" />
        </div>

        {/* LEGEND */}
        <div className="text-xs opacity-60 mb-6">
          <p>EMPTY = NOT ATTENDING</p>
          <p>FILLED = ATTENDING</p>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-xs underline opacity-70"
          >
            EXIT
          </button>

          <button
            className="border border-[#45CC2D] px-4 py-2 text-sm hover:bg-[#45CC2D] hover:text-black transition"
            onClick={() => {
              console.log("SUBMIT (placeholder)", selections);
            }}
          >
            TRANSMIT
          </button>
        </div>
      </div>
    </div>
  );
}