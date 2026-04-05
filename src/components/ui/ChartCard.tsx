interface Props { title: string; subtitle?: string; tag?: string; children: React.ReactNode; className?: string; }

export default function ChartCard({ title, subtitle, tag, children, className = "" }: Props) {
  return (
    <div className={`bg-[#0F1510] border border-[#1C2620] rounded-xl p-6 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[13px] font-semibold text-[#F0F5F1]">{title}</div>
          {subtitle && <div className="text-[11px] text-[#3A4A3E] mt-0.5">{subtitle}</div>}
        </div>
        {tag && (
          <span className="text-[9px] font-semibold px-2 py-1 rounded-md bg-[#2DD4BF]/8 text-[#2DD4BF]/70 tracking-[1px] uppercase border border-[#2DD4BF]/10">
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
