import Sidebar from "@/components/ui/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#080C0A]">
      <Sidebar />
      <main className="flex-1 pt-12 sm:pt-0 sm:ml-[220px] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
