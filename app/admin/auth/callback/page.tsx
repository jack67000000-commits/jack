"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminAuthCallbackPage() {
  const [message, setMessage] = useState("正在验证登录…");

  useEffect(() => {
    const finishLogin = async () => {
      const { data: existingData } = await supabase.auth.getSession();
      if (existingData.session?.user.email) {
        window.location.replace("/admin");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        setMessage("没有检测到登录验证码，请返回登录页面重试。");
        return;
      }

      const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage("登录验证未完成，请返回登录页面重新尝试。");
        return;
      }

      if (!exchangeData.session?.user.email) {
        setMessage("没有检测到有效登录，请返回登录页面重试。");
        return;
      }

      window.location.replace("/admin");
    };

    finishLogin();
  }, []);

  return (
    <main className="callbackPage">
      <img src="/winking-logo.png" alt="Winking.Game" />
      <span className="callbackSpinner" />
      <h1>{message}</h1>
      <p>验证完成后将自动进入管理后台。</p>
      <a href="/admin/login">返回登录页面</a>
    </main>
  );
}