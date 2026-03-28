"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (!res.ok) {
        setError("Incorrect passcode.");
        return;
      }

      router.push("/owner/dashboard");
    } catch {
      setError("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-[#E0E0E0] rounded-none mb-6 text-2xl text-[#888888]">
            &#128274;
          </div>
          <h1 className="font-mono text-xl uppercase tracking-[2px] mb-2">
            Owner Access
          </h1>
          <p className="font-serif text-base italic">
            Enter the passcode to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type={showPasscode ? "text" : "password"}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              className="w-full bg-transparent border border-[#E0E0E0] rounded-none px-3 py-2.5 font-mono text-sm pr-12 focus:outline-none focus:border-[#0D0D0D] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#888888] hover:text-[#0D0D0D] cursor-pointer"
            >
              {showPasscode ? "HIDE" : "\u2022\u2022\u2022"}
            </button>
          </div>

          {error && (
            <p className="font-mono text-[10px] text-[#C45C4A] uppercase tracking-[1px] text-center">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "..." : "Enter"}
          </Button>
        </form>
      </div>
    </main>
  );
}
