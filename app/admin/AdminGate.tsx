"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

const publicAdminPaths = ["/admin/login", "/admin/auth/callback"];

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = publicAdminPaths.some((path) => pathname.startsWith(path));
  const [status, setStatus] = useState<"checking" | "ready" | "denied">(
    isPublicPath ? "ready" : "checking",
  );

  useEffect(() => {
    if (isPublicPath) {
      setStatus("ready");
      return;
    }

    if (!hasSupabaseConfig) {
      setStatus("denied");
      return;
    }

    let active = true;

    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user.email?.toLowerCase();

      if (!email) {
        router.replace("/admin/login");
        return;
      }

      const { data: admin, error } = await supabase
        .from("winking_admins")
        .select("email, active, role")
        .eq("email", email)
        .eq("active", true)
        .maybeSingle();

      if (!active) return;
      if (error || !admin) {
        await supabase.auth.signOut();
        setStatus("denied");
        return;
      }

      setStatus("ready");
    };

    verifySession();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/admin/login");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [isPublicPath, router]);

  if (status === "checking") {
    return <main className="adminGateState"><span /><b>正在验证管理员身份</b><small>请稍候…</small></main>;
  }

  if (status === "denied") {
    return <main className="adminGateState denied"><b>无法进入后台</b><small>此邮箱没有管理员权限，或后台连接尚未完成。</small><a href="/admin/login">返回登录页面</a></main>;
  }

  return children;
}

