"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useParams } from "next/navigation";

export default function UnsubscribePage() {
  const params = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const unsubscribe = async () => {
      if (!params || !params.contactId) {
          setStatus("error");
          return;
      }
      try {
        const res = await fetch(`/api/unsubscribe?contactId=${params.contactId}&campaignId=${params.campaignId || ""}`);
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    unsubscribe();
  }, [params]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl">
        {status === "loading" && (
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
            <p className="text-white/60">Please wait while we update your preferences.</p>
          </div>
        )}

        {status === "success" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Unsubscribed Successfully</h2>
            <p className="text-white/70 text-lg mb-8">
              You have been successfully removed from our mailing list and will no longer receive these emails.
            </p>
            <p className="text-white/40 text-sm">You may now close this window.</p>
          </div>
        )}

        {status === "error" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-white/70 text-lg">
              We couldn't process your request. The link might be invalid or expired.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
