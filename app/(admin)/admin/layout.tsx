import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/app/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Ensure they are an admin or owner
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "owner") {
     // If not an admin/owner, boot them back to the user portal
     redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full relative">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-red-900/10 blur-[120px] animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-orange-900/10 blur-[120px] animate-blob animation-delay-2000"></div>
        </div>

        <AdminSidebar />
        <main className="flex-1 overflow-y-auto w-full relative z-10">
            {children}
        </main>
    </div>
  );
}
