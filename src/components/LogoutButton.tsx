"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/job");
    router.refresh();
  };

  return (
    <button className="btn btn-ghost" type="button" onClick={handleLogout}>
      退出
    </button>
  );
}
