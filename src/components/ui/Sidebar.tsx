"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Clock, Wallet, Brain,
  PlusCircle, Settings, Menu, X
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { section: "Overview", items: [
    { label: "Dashboard",    href: "/dashboard", icon: LayoutDashboard },
    { label: "Audit Report", href: "/report",    icon: FileText },
  ]},
  { section: "Pillars", items: [
    { label: "Time",      href: "/time",      icon: Clock },
    { label: "Money",     href: "/money",     icon: Wallet },
    { label: "Attention", href: "/attention", icon: Brain },
  ]},
  { section: "Log", items: [
    { label: "Manual Entry", href: "/entry",    icon: PlusCircle },
    { label: "Settings",     href: "/settings", icon: Settings },
  ]},
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const path = usePathname();
  const { profile } = useAuth();
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "LA";
  const email = profile?.email ?? "";
  const emailDomain = email.includes("@") ? email.split("@")[1] : email;

  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#2DD4BF] flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-sm bg-[#080C0A]" />
            </div>
            <span className="text-[15px] font-bold text-[#F0F5F1] tracking-tight">
              Life<span className="text-[#2DD4BF]">Audit</span>
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#3A4A3E] hover:text-[#6B7F70] transition-colors sm:hidden">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section} className="mb-4">
            <div className="text-[9px] uppercase tracking-[2px] text-[#3A4A3E] px-2 py-1.5 font-semibold">
              {group.section}
            </div>
            {group.items.map((item) => {
              const active = path === item.href || path.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] mb-0.5 transition-all group",
                    active
                      ? "bg-[#2DD4BF]/8 text-[#2DD4BF] font-medium"
                      : "text-[#6B7F70] hover:text-[#F0F5F1] hover:bg-[#141C15]"
                  )}
                >
                  <item.icon size={13} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-[#2DD4BF] flex-shrink-0" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-[#1C2620]" />

      {/* User */}
      <div className="px-4 py-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[#141C15] border border-[#1C2620] flex items-center justify-center text-[#2DD4BF] font-bold text-[10px] flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[#F0F5F1] text-[11px] font-medium truncate">
            {profile?.full_name ?? "Life Audit"}
          </div>
          <div className="text-[#3A4A3E] text-[10px] truncate">{emailDomain}</div>
        </div>
      </div>
    </>
  );
}

function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-[#080C0A] h-12 flex items-center justify-between px-4 border-b border-[#1C2620]">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-[#2DD4BF] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-sm bg-[#080C0A]" />
        </div>
        <span className="text-[14px] font-bold text-[#F0F5F1]">
          Life<span className="text-[#2DD4BF]">Audit</span>
        </span>
      </div>
      <button onClick={onOpen} className="text-[#6B7F70] hover:text-[#F0F5F1] transition-colors">
        <Menu size={18} />
      </button>
    </header>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <MobileTopBar onOpen={() => setMobileOpen(true)} />
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 sm:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={clsx(
        "fixed top-0 left-0 h-screen w-[220px] bg-[#080C0A] border-r border-[#1C2620] flex flex-col z-50 transition-transform duration-200 sm:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent onClose={() => setMobileOpen(false)} />
      </aside>
      <aside className="hidden sm:flex fixed top-0 left-0 h-screen w-[220px] bg-[#080C0A] border-r border-[#1C2620] flex-col z-40">
        <NavContent />
      </aside>
    </>
  );
}
