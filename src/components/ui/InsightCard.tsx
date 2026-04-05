type T = "gap"|"win"|"info";
interface Props { type: T; tag: string; text: React.ReactNode; action?: string; }

const S: Record<T, { accent: string; tag: string }> = {
  gap:  { accent: "border-l-[#F87171]",  tag: "text-[#F87171]" },
  win:  { accent: "border-l-[#2DD4BF]",  tag: "text-[#2DD4BF]" },
  info: { accent: "border-l-[#A78BFA]",  tag: "text-[#A78BFA]" },
};

export default function InsightCard({ type, tag, text, action }: Props) {
  const s = S[type];
  return (
    <div className={`bg-[#0F1510] border border-[#1C2620] border-l-2 ${s.accent} rounded-xl p-5`}>
      <div className={`text-[9px] font-bold uppercase tracking-[2px] mb-2.5 ${s.tag}`}>{tag}</div>
      <div className="text-[12px] text-[#6B7F70] leading-relaxed">{text}</div>
      {action && (
        <div className={`text-[11px] font-semibold mt-3 cursor-pointer hover:opacity-80 transition-opacity ${s.tag}`}>
          {action}
        </div>
      )}
    </div>
  );
}
