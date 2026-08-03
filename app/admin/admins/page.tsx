"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import { supabase } from "../../lib/supabase";
import "../admin.css";
import "./admins.css";

type AdminRole = "owner" | "content" | "links" | "viewer";
type AdminUser = {
  email: string;
  display_name: string;
  role: AdminRole;
  active: boolean;
  created_at?: string;
};

const roleLabels: Record<AdminRole, string> = {
  owner: "全部权限",
  content: "游戏与内容",
  links: "参数与链接",
  viewer: "只读访客",
};

const memberRoles: Array<{ value: Exclude<AdminRole, "owner">; label: string }> = [
  { value: "content", label: "游戏与内容" },
  { value: "links", label: "参数与链接" },
  { value: "viewer", label: "只读访客" },
];

export default function AdminsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deactivating, setDeactivating] = useState<AdminUser | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadUsers = async () => {
    const [{ data: authData }, { data, error: loadError }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("winking_admins").select("email, display_name, role, active, created_at").order("created_at", { ascending: true }),
    ]);

    if (loadError) {
      setError("读取管理员名单失败：" + loadError.message);
      return;
    }

    setCurrentEmail(authData.user?.email?.toLowerCase() ?? "");
    setUsers((data ?? []) as AdminUser[]);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const currentAdmin = useMemo(
    () => users.find((user) => user.email.toLowerCase() === currentEmail),
    [currentEmail, users],
  );
  const canManage = currentAdmin?.role === "owner";

  const invokeMemberAction = async (body: Record<string, unknown>) => {
    const { error: functionError } = await supabase.functions.invoke("admin-members", { body });
    if (!functionError) return;

    let message = functionError.message;
    const context = (functionError as unknown as { context?: Response }).context;
    if (context) {
      try {
        const payload = await context.json() as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // Keep the standard function error.
      }
    }
    throw new Error(message);
  };

  const createMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);

    try {
      await invokeMemberAction({
        action: "create",
        display_name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        role: String(form.get("role") ?? "viewer"),
        password: String(form.get("password") ?? ""),
      });
      setCreating(false);
      setNotice("成员已创建，现在可以使用邮箱和初始密码登录。");
      await loadUsers();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建成员失败。");
    } finally {
      setBusy(false);
    }
  };

  const saveMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);

    try {
      if (editing.role === "owner") {
        await invokeMemberAction({ action: "set_own_password", password: String(form.get("password") ?? "") });
        setNotice("Owner 的普通登录密码已设置，可以退出后使用邮箱和密码登录。");
      } else {
        await invokeMemberAction({
          action: "update",
          previous_email: editing.email,
          display_name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          role: String(form.get("role") ?? "viewer"),
          password: String(form.get("password") ?? ""),
        });
        setNotice("成员资料和登录权限已更新。");
      }
      setEditing(null);
      await loadUsers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  };

  const changeActive = async (user: AdminUser, active: boolean) => {
    if (user.role === "owner") {
      setError("唯一 Owner 账号受系统保护，不能停用或删除。");
      return;
    }

    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.from("winking_admins").update({ active }).eq("email", user.email);

    if (updateError) {
      setError("更新账号状态失败：" + updateError.message);
    } else {
      setNotice(active ? "成员已重新启用。" : "成员已停用，将无法进入后台。");
      setDeactivating(null);
      await loadUsers();
    }
    setBusy(false);
  };

  return (
    <div className="adminShell">
      <AdminSidebar active="admins" />
      <main className="content adminsContent">
        <header>
          <div>
            <small>管理后台 / 管理员</small>
            <h1>管理员与权限</h1>
            <p>创建可独立登录的成员账号，并控制角色和账号状态。</p>
          </div>
          <div className="headActions">
            <a href="/admin/login">登录页面 →</a>
            {canManage && <button onClick={() => setCreating(true)}>＋ 新增管理员</button>}
          </div>
        </header>

        {error && <div className="adminMessage error">! {error}</div>}
        {notice && <div className="adminMessage success">✓ {notice}</div>}

        <section className="adminCards">
          <article><small>管理员账号</small><b>{users.length}</b><span>全部账号均独立验证</span></article>
          <article><small>已启用账号</small><b>{users.filter((user) => user.active).length}</b><span>可使用 Google 或普通密码登录</span></article>
          <article><small>Owner 保护</small><b>已开启</b><span>唯一全部权限账号不可删除或停用</span></article>
        </section>

        <section className="accountPanel">
          <div className="accountHead">
            <div><h2>管理员账号</h2><p>管理登录信息、角色权限和账号状态</p></div>
          </div>
          <div className="accountTable">
            <div className="accountThead"><span>管理员</span><span>角色权限</span><span>登录方式</span><span>状态</span><span>操作</span></div>
            {users.map((user) => (
              <div className="accountRow" key={user.email}>
                <div className="accountId">
                  <b>{user.display_name.slice(0, 1).toUpperCase()}</b>
                  <span><strong>{user.display_name}</strong><small>{user.email}</small></span>
                </div>
                <span className="role">{roleLabels[user.role]}</span>
                <span>Google / 密码</span>
                <span className={user.active ? "accountStatus live" : "accountStatus"}>● {user.active ? "已启用" : "已停用"}</span>
                <div className="accountActions">
                  {user.role === "owner" ? (
                    <>
                      {canManage && currentEmail === user.email.toLowerCase() && <button onClick={() => setEditing(user)}>设置密码</button>}
                      <span className="ownerLock">受保护</span>
                    </>
                  ) : canManage ? (
                    <>
                      <button onClick={() => setEditing(user)}>编辑权限</button>
                      <div className="moreWrap">
                        <button className="moreButton" onClick={() => setMenu(menu === user.email ? null : user.email)}>•••</button>
                        {menu === user.email && (
                          <div className="actionMenu">
                            <button onClick={() => { setEditing(user); setMenu(null); }}>编辑账号</button>
                            {user.active ? (
                              <button className="deleteAction" onClick={() => { setDeactivating(user); setMenu(null); }}>停用管理员</button>
                            ) : (
                              <button onClick={() => { void changeActive(user, true); setMenu(null); }}>重新启用</button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : <span>无操作权限</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {creating && (
        <div className="backdrop" onMouseDown={() => setCreating(false)}>
          <form className="modal" onSubmit={createMember} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modalClose" onClick={() => setCreating(false)}>×</button>
            <small>账号管理</small><h2>新增管理员</h2>
            <div className="formPair">
              <label>管理员姓名<input name="name" placeholder="请输入姓名" required /></label>
              <label>登录邮箱<input name="email" type="email" placeholder="name@example.com" required /></label>
            </div>
            <label>管理员角色
              <select name="role" defaultValue="content">
                {memberRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </label>
            <label>初始密码<input name="password" type="password" minLength={10} placeholder="至少 10 位字符" autoComplete="new-password" required /></label>
            <div className="permissionBox"><b>登录说明</b><span>创建后无需邮件确认，成员可立即使用邮箱和初始密码登录。</span></div>
            <div className="modalActions"><button type="button" onClick={() => setCreating(false)}>取消</button><button className="save" type="submit" disabled={busy}>创建管理员</button></div>
          </form>
        </div>
      )}

      {editing && (
        <div className="backdrop" onMouseDown={() => setEditing(null)}>
          <form className="modal" onSubmit={saveMember} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modalClose" onClick={() => setEditing(null)}>×</button>
            <small>账号管理</small><h2>{editing.role === "owner" ? "设置我的登录密码" : "编辑管理员"}</h2>
            {editing.role === "owner" ? (
              <>
                <div className="ownerIdentity"><b>{editing.display_name}</b><span>{editing.email}</span><small>唯一 Owner 账号不可删除、停用或降级</small></div>
                <label>新密码<input name="password" type="password" minLength={10} placeholder="至少 10 位字符" autoComplete="new-password" required /></label>
              </>
            ) : (
              <>
                <div className="formPair">
                  <label>管理员姓名<input name="name" defaultValue={editing.display_name} required /></label>
                  <label>登录邮箱<input name="email" type="email" defaultValue={editing.email} required /></label>
                </div>
                <label>管理员角色
                  <select name="role" defaultValue={editing.role}>
                    {memberRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </label>
                <label>重设密码（可选）<input name="password" type="password" minLength={10} placeholder="不修改请留空" autoComplete="new-password" /></label>
              </>
            )}
            <div className="modalActions"><button type="button" onClick={() => setEditing(null)}>取消</button><button className="save" type="submit" disabled={busy}>保存修改</button></div>
          </form>
        </div>
      )}

      {deactivating && deactivating.role !== "owner" && (
        <div className="backdrop" onMouseDown={() => setDeactivating(null)}>
          <div className="modal deleteAdminModal" role="alertdialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <span className="dangerIcon">!</span><small>停用警告</small><h2>确认停用此管理员？</h2>
            <p>停用后，该账号会立即失去后台登录权限，但账号资料会保留，之后可以重新启用。</p>
            <div className="deleteAdminTarget"><b>{deactivating.display_name}</b><span>{deactivating.email}</span><i>{roleLabels[deactivating.role]}</i></div>
            <div className="modalActions"><button onClick={() => setDeactivating(null)}>取消</button><button className="confirmDelete" disabled={busy} onClick={() => void changeActive(deactivating, false)}>确认停用</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
