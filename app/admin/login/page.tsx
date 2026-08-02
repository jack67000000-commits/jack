"use client";

import { FormEvent, useState } from "react";
import "./login.css";

const ADMIN_EMAIL = "jack67000000@gmail.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password.length < 6) {
      setError("邮箱或密码不正确，请检查后重试。");
      return;
    }
    sessionStorage.setItem("winking-admin-demo", email.trim().toLowerCase());
    window.location.href = "/admin";
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
        <small>© 2026 Winking.Game</small>
      </section>
      <section className="loginPanel">
        <form onSubmit={signIn}>
          <span className="loginBadge">管理员后台</span>
          <h2>欢迎回来</h2>
          <p>使用已授权的管理员账号登录。</p>
          <label>管理员邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
          <label>登录密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入至少 6 位密码" autoComplete="current-password" required /></label>
          <div className="loginOptions"><label><input type="checkbox" defaultChecked />保持登录</label><button type="button">忘记密码？</button></div>
          {error && <div className="loginError">! {error}</div>}
          <button className="loginSubmit" type="submit">进入管理后台　→</button>
          <div className="loginNotice"><b>演示版登录说明</b><span>当前授权邮箱：{ADMIN_EMAIL}</span><span>暂未连接正式数据库，密码仅用于界面验证。</span></div>
        </form>
      </section>
    </main>
  );
}
