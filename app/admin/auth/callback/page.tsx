"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminAuthCallbackPage() {
  const [message, setMessage] = useState("正在验证登录链接…");

  useEffect(() => {
    const finishLogin = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("登录链接无效或已经过期，请返回重新发送。");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user.email) {
        setMessage("没有检测到有效登录，请返回重新发送验证邮件。");
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
