import Sidebar from "@/app/components/Sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full">
            {children}
        </main>
    </div>
  );
}
