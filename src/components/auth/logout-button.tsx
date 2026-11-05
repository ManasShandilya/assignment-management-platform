"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button variant="ghost" className={className} loading={loading} onClick={async () => {
      setLoading(true);
      await postJson("/api/auth/logout", {});
      router.replace("/login");
      router.refresh();
    }}>
      <LogOut className="h-4 w-4" aria-hidden /> Log out
    </Button>
  );
}
