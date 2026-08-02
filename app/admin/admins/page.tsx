"use client";

import { FormEvent, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "./admins.css";

type AdminUser = {
  n: string;
  e: string;
  r: string;
  t: string;
  s: string;
};

const initialUsers: AdminUser[] = [
  { n: "超级管理员", e: "admin@winking.game", r: "全部权限", t: "刚刚", s: "在线" },
  { n: "内容管理员", e: "content@winking.game", r: "游戏与内容", t: "今天 09:42", s: "正常" },
  { n: "运营人员", e: "ops@winking.game", r: "参数与链接", t: "昨天 18:20", s: "正常" },
];

export default function AdminsPage() {
  const [users, setUsers] = useState(initialUsers);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [menu, setMenu] = useState<string | null>(null);

  const saveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    setUsers((current) => current.map((user) => user.e === editing.e ? {
      ...user,
      n: String(data.get("name")),
      e: String(data.get("email")),
      r: String(data.get("role")),
    } : user));
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setUsers((current) => current.filter((user) => user.e !== deleting.e));
    setDeleting(null);
  };

  return (
    <div className="adminShell">
      <AdminSidebar active="admins" />
      <main className="content adminsContent">
        <header>
          <div>
            <small>管理后台 / 管理员</small>
            <h1>管理员与权限</h1>
            <p>创建后台账号，并控制每位管理员可操作的功能。</p>
          </div>
          <div className="headActions">
            <a href="/admin/login">登录页面 ↗</a>
            <button onClick={() => setCreating(true)}>＋ 新增管理员</button>
          </div>
        </header>

        <section className="adminCards">
          <article><small>管理员账号</small><b>{users.length}</b><span>账号均可独立编辑权限</span></article>
          <article><small>在线管理员</small><b>{users.filter((user) => user.s === "在线").length}</b><span>超级管理员当前在线</span></article>
          <article><small>安全状态</small><b>正常</b><span>删除账号需要二次确认</span></article>
        </section>

        <section className="accountPanel">
          <div className="accountHead">
            <div><h2>管理员账号</h2><p>管理登录信息、角色权限和账号状态</p></div>
            <label>⌕<input placeholder="搜索姓名或邮箱" /></label>
          </div>
          <div className="accountTable">
            <div className="accountThead"><span>管理员</span><span>角色权限</span><span>最近登录</span><span>状态</span><span>操作</span></div>
            {users.map((user) => (
              <div className="accountRow" key={user.e}>
                <div className="accountId"><b>{user.n[0]}</b><span><strong>{user.n}</strong><small>{user.e}</small></span></div>
                <span className="role">{user.r}</span>
                <span>{user.t}</span>
                <span className={user.s === "在线" ? "accountStatus live" : "accountStatus"}>● {user.s}</span>
                <div className="accountActions">
                  <button onClick={() => setEditing(user)}>编辑权限</button>
                  <div className="moreWrap">
                    <button className="moreButton" aria-label={"打开 " + user.n + " 的更多操作"} onClick={() => setMenu(menu === user.e ? null : user.e)}>•••</button>
                    {menu === user.e && (
                      <div className="actionMenu">
                        <button onClick={() => { setEditing(user); setMenu(null); }}>编辑账号</button>
                        <button className="deleteAction" onClick={() => { setDeleting(user); setMenu(null); }}>删除管理员</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {creating && (
        <div className="back" onMouseDown={() => setCreating(false)}>
          <div className="edit adminCreate" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setCreating(false)}>×</button>
            <small>账号管理</small><h2>新增管理员</h2>
            <div className="pair"><label>管理员姓名<input placeholder="请输入姓名" /></label><label>登录邮箱<input type="email" placeholder="name@winking.game" /></label></div>
            <label>管理员角色<select><option>内容管理员</option><option>运营人员</option><option>只读访客</option><option>超级管理员</option></select></label>
            <label>初始密码<input type="password" placeholder="至少 10 位，包含字母和数字" /></label>
            <div className="permissionBox"><b>权限预览</b><span>✓ 查看数据　✓ 编辑游戏　✓ 上传图片　○ 管理账号</span></div>
            <div className="modalActions"><button onClick={() => setCreating(false)}>取消</button><button className="save" onClick={() => setCreating(false)}>创建管理员</button></div>
          </div>
        </div>
      )}

      {editing && (
        <div className="back" onMouseDown={() => setEditing(null)}>
          <form className="edit adminCreate" onSubmit={saveEdit} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="close" onClick={() => setEditing(null)}>×</button>
            <small>账号管理</small><h2>编辑管理员</h2>
            <p className="editHint">修改账号资料和后台操作权限。</p>
            <div className="pair">
              <label>管理员姓名<input name="name" defaultValue={editing.n} required /></label>
              <label>登录邮箱<input name="email" type="email" defaultValue={editing.e} required /></label>
            </div>
            <label>管理员角色<select name="role" defaultValue={editing.r}><option>全部权限</option><option>游戏与内容</option><option>参数与链接</option><option>只读访客</option></select></label>
            <div className="permissionBox"><b>权限说明</b><span>角色变更会在该管理员下一次操作时生效。</span></div>
            <div className="modalActions"><button type="button" onClick={() => setEditing(null)}>取消</button><button className="save" type="submit">保存修改</button></div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="back" onMouseDown={() => setDeleting(null)}>
          <div className="edit deleteModal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setDeleting(null)}>×</button>
            <span className="dangerIcon">!</span>
            <small>高风险操作</small>
            <h2 id="delete-title">确认删除管理员？</h2>
            <p>删除后，该账号将立即失去后台登录权限，且此操作无法撤销。</p>
            <div className="deleteTarget"><b>{deleting.n}</b><span>{deleting.e}</span><i>{deleting.r}</i></div>
            {deleting.r === "全部权限" && <div className="ownerWarning">当前账号拥有全部权限。正式上线后，系统将禁止删除唯一的超级管理员。</div>}
            <div className="modalActions"><button onClick={() => setDeleting(null)}>取消</button><button className="confirmDelete" onClick={confirmDelete}>确认删除</button></div>
          </div>
        </div>
      )}
    </div>
  );
}