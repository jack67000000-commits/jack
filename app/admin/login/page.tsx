"use client";

import { FormEvent, useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "../../lib/supabase";
import "./login.css";

const ADMIN_EMAIL = "jack67000000@gmail.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/admin");
    });
  }, []);

  const signInWithGoogle = async () => {
    setError("");

    if (!hasSupabaseConfig) {
      setError("后台登录服务尚未配置完成。");
      return;
    }

    setLoading("google");
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/admin/auth/callback",
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (googleError) {
      setLoading(null);
      setError("Google 登录暂未启用：" + googleError.message);
    }
  };

  const signInWithEmail = async (event: FormEvent<HTMLFormElement>) => {
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

    setLoading("email");
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin + "/admin/auth/callback",
      },
    });
    setLoading(null);

    if (signInError) {
      if (signInError.status === 429) {
        setError("发送过于频繁，请等待约一分钟后重试。");
      } else {
        setError("备用登录邮件发送失败：" + signInError.message);
      }
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
        <div className="loginCard">
          <span className="loginBadge">安全管理员后台</span>
          <h2>{sent ? "请检查邮箱" : "欢迎回来"}</h2>
          <p>{sent ? "备用登录链接已发送，请使用最新邮件。" : "建议使用已授权的 Google 账号快速登录。"}</p>

          {!sent ? (
            <>
              <button className="loginGoogle" type="button" onClick={signInWithGoogle} disabled={loading !== null}>
                <span className="googleMark" aria-hidden="true">G</span>
                {loading === "google" ? "正在连接 Google…" : "使用 Google 账号登录"}
              </button>

              <div className="loginDivider"><span>或使用备用邮箱登录</span></div>

              <form className="loginEmailForm" onSubmit={signInWithEmail}>
                <label>
                  管理员邮箱
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
                </label>
                <button className="loginSubmit secondary" type="submit" disabled={loading !== null}>
                  {loading === "email" ? "正在发送…" : "发送备用登录邮件"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="loginSuccess">
                <b>✓ 邮件已发送</b>
                <span>发送至：{email}</span>
                <small>请使用最新邮件中的链接，旧链接会自动失效。</small>
              </div>
              <button className="loginSubmit secondary" type="button" onClick={() => { setSent(false); setError(""); }}>
                返回登录方式
              </button>
            </>
          )}

          {error && <div className="loginError">! {error}</div>}

          <div className="loginNotice">
            <b>独立安全登录</b>
            <span>授权账号：{ADMIN_EMAIL}</span>
            <span>其他 Google 账号即使完成验证，也无法进入管理后台。</span>
          </div>
        </div>
      </section>
    </main>
  );
}
