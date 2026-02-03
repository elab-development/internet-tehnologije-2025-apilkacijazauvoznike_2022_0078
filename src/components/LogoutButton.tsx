"use client";

import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";

export default function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
  }

  return (
    <Button variant="secondary" onClick={onLogout}>
      Logout
    </Button>
  );
}