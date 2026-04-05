interface Chip { label: string; type: "green" | "amber" | "red" }
interface Props { score: number; headline: string; description: string; chips: Chip[] }

const CHIP = {
  green: "bg-[#2DD4BF]/8 text-[#2DD4BF] border border-[#2DD4BF]/15",
  amber: "bg-[#FB923C]/8 text-[#FB923C] border border-[#FB923C]/15",
  red:   "bg-[#F87171]/8 text-[#F87171] border border-[#F87171]/15",
};

export default function AlignmentBanner({ score, headline, description, chips }: Props) {
  const R = 34; const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score / 100);
  const label = headline.replace("Alignment Score: ", "");

  return (
    <div className="bg-[#0F1510] border border-[#1C2620] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
      {/* Score ring */}
      <div className="relative flex-shrink-0 w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r={R} fill="none" stroke="#1C2620" strokeWidth="5" />
          <circle cx="40" cy="40" r={R} fill="none" stroke="#2DD4BF" strokeWidth="5"
            strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[#F0F5F1] font-bold text-lg leading-none">{score}</span>
          <span className="text-[#3A4A3E] text-[9px] mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] uppercase tracking-[2px] text-[#2DD4BF]/60 font-semibold">Weekly Alignment</span>
        </div>
        <div className="text-[16px] font-semibold text-[#F0F5F1] mb-1.5">{label}</div>
        <div className="text-[12px] text-[#6B7F70] leading-relaxed mb-4 max-w-[480px]">{description}</div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c.label} className={`text-[10px] font-medium px-2.5 py-1 rounded-md ${CHIP[c.type]}`}>
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
