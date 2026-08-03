"use client";

import { FormEvent, useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "../../lib/supabase";
import "./login.css";

const OWNER_EMAIL = "jack67000000@gmail.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"google" | "password" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/admin");
    });
  }, []);

  const verifyAdminAndEnter = async (normalizedEmail: string) => {
    const { data: admin, error: adminError } = await supabase
      .from("winking_admins")
      .select("email, active")
      .eq("email", normalizedEmail)
      .eq("active", true)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      throw new Error("此账号未被加入管理员名单，或账号已被停用。");
    }

    window.location.replace("/admin");
  };

  const signInWithPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!hasSupabaseConfig) {
      setError("后台登录服务尚未配置完成。");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setLoading("password");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      setLoading(null);
      setError("邮箱或密码不正确，请重新输入。");
      return;
    }

    try {
      await verifyAdminAndEnter(normalizedEmail);
    } catch (verifyError) {
      setLoading(null);
      setError(verifyError instanceof Error ? verifyError.message : "无法进入后台。");
    }
  };

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
        queryParams: { prompt: "select_account" },
      },
    });

    if (googleError) {
      setLoading(null);
      setError("Google 登录暂时不可用：" + googleError.message);
    }
  };

  return (
    <main className="loginPage">
      <section className="loginBrand">
        <img src="/winking-logo.png" alt="Winking.Game" />
        <div>
          <span>WINKING 管理系统</span>
          <h1>让游戏内容管理<br />更清晰、更安全。</h1>
          <p>管理游戏、图片、预测参数、跳转链接与后台成员账号。</p>
        </div>
        <small>© 2026 Winking.Games</small>
      </section>

      <section className="loginPanel">
        <div className="loginCard">
          <span className="loginBadge">安全管理员后台</span>
          <h2>欢迎回来</h2>
          <p>使用系统中已授权的管理员邮箱和密码登录。</p>

          <form className="loginEmailForm" onSubmit={signInWithPassword}>
            <label>
              管理员邮箱
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
            </label>
            <label>
              登录密码
              <div className="passwordField">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={10} required />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "隐藏" : "显示"}</button>
              </div>
            </label>
            <button className="loginSubmit" type="submit" disabled={loading !== null}>{loading === "password" ? "正在验证…" : "使用密码登录"}</button>
          </form>

          <div className="loginDivider"><span>或</span></div>
          <button className="loginGoogle" type="button" onClick={signInWithGoogle} disabled={loading !== null}>
            <span className="googleMark" aria-hidden="true">G</span>
            {loading === "google" ? "正在连接 Google…" : "使用 Google 账号登录"}
          </button>

          {error && <div className="loginError">! {error}</div>}
          <div className="loginNotice">
            <b>独立安全登录</b>
            <span>只有“管理员”页面中已启用的成员可以登录。</span>
            <span>新增成员时设置初始密码，成员即可用自己的邮箱和密码进入后台。</span>
          </div>
        </div>
      </section>
    </main>
  );
}
