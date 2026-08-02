"use client";

import { FormEvent, useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "../../lib/supabase";
import "./login.css";

const ADMIN_EMAIL = "jack67000000@gmail.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/admin");
    });
  }, []);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!hasSupabaseConfig) {
      setError("后台登录服务尚未配置完成。");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== ADMIN_EMAIL) {
      setError("此邮箱没有后台登录权限。");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + "/admin/auth/callback",
      },
    });
    setLoading(false);

    if (signInError) {
      setError("验证邮件发送失败：" + signInError.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="loginPage">
      <section className="loginBrand">
        <img src="/winking-logo.png" alt="Winking.Game" />
        <div>
          <span>WINKING 管理系统</span>
          <h1>让游戏内容管理<br />更清晰、更安全。</h1>
          <p>管理游戏、图片、预测参数、跳转链接与后台账号。</p>
        </div>
        <small>© 2026 Winking.Games</small>
      </section>
      <section className="loginPanel">
        <form onSubmit={signIn}>
          <span className="loginBadge">安全管理员后台</span>
          <h2>{sent ? "请检查邮箱" : "欢迎回来"}</h2>
          <p>{sent ? "我们已发送安全登录链接，点击邮件中的链接即可进入后台。" : "使用已授权的管理员邮箱获取登录链接。"}</p>

          {!sent ? (
            <>
              <label>
                管理员邮箱
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </label>
              {error && <div className="loginError">! {error}</div>}
              <button className="loginSubmit" type="submit" disabled={loading}>
                {loading ? "正在发送…" : "发送登录验证邮件　→"}
              </button>
            </>
          ) : (
            <>
              <div className="loginSuccess"><b>✓ 邮件已发送</b><span>发送至：{email}</span><small>登录链接会在一段时间后失效，请尽快使用。</small></div>
              <button className="loginSubmit secondary" type="button" onClick={() => setSent(false)}>重新发送</button>
            </>
          )}

          <div className="loginNotice">
            <b>独立安全登录</b>
            <span>授权邮箱：{ADMIN_EMAIL}</span>
            <span>无需使用 ChatGPT 账号，也不需要在此页面输入密码。</span>
          </div>
        </form>
      </section>
    </main>
  );
}