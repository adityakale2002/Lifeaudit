import clsx from "clsx";
interface Props { label: string; value: string; delta?: string; deltaType?: "up"|"down"|"neutral"; icon?: string; }

export default function StatCard({ label, value, delta, deltaType = "neutral", icon }: Props) {
  return (
    <div className="bg-[#0F1510] border border-[#1C2620] rounded-xl p-5 hover:border-[#2DD4BF]/20 transition-all cursor-default group">
      <div className="flex items-center gap-1.5 text-[10px] text-[#3A4A3E] font-semibold uppercase tracking-[1.5px] mb-4">
        {icon && <span className="text-[13px]">{icon}</span>}
        {label}
      </div>
      <div className="text-[26px] font-bold text-[#F0F5F1] leading-none mb-2 group-hover:text-[#2DD4BF] transition-colors">{value}</div>
      {delta && (
        <div className={clsx("text-[11px] font-medium", {
          "text-[#2DD4BF]":  deltaType === "up",
          "text-[#F87171]":  deltaType === "down",
          "text-[#3A4A3E]":  deltaType === "neutral",
        })}>
          {delta}
        </div>
      )}
    </div>
  );
}
