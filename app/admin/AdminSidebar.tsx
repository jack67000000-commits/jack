type AdminSection = "dashboard" | "games" | "admins" | "system";

const groups = [
  { title: "工作台", items: [
    { key: "dashboard", href: "/admin", icon: "⌂", label: "数据总览" },
    { key: "games", href: "/admin/games", icon: "▦", label: "游戏管理", badge: "595" },
    { key: "providers", icon: "◫", label: "供应商管理", badge: "6", pending: true },
  ] },
  { title: "运营设置", items: [
    { key: "forecast", icon: "↗", label: "预测参数", pending: true },
    { key: "links", icon: "⌁", label: "跳转链接", pending: true },
    { key: "ranking", icon: "☷", label: "排序与推荐", pending: true },
  ] },
  { title: "系统", items: [
    { key: "admins", href: "/admin/admins", icon: "♙", label: "管理员", badge: "3" },
    { key: "system", href: "/admin/system", icon: "⚙", label: "系统维护" },
  ] },
] as const;

export default function AdminSidebar({ active }: { active: AdminSection }) {
  return (
    <aside className="side">
      <a className="adminLogo" href="/admin" aria-label="返回后台首页"><img src="/winking-logo.png" alt="Winking.Game" /></a>
      <div className="workspace">
        <div><small>当前工作区</small><i>演示版</i></div>
        <b>Winking 预测平台</b>
        <span><i /> 本地预览运行正常</span>
      </div>
      <nav aria-label="后台主导航">
        {groups.map((group) => <div className="navGroup" key={group.title}>
          <p>{group.title}</p>
          {group.items.map((item) => {
            const body = <><span className="navIcon">{item.icon}</span><span className="navLabel">{item.label}</span>{"badge" in item && <i className="navBadge">{item.badge}</i>}{"pending" in item && <em>即将开放</em>}</>;
            return "href" in item ? <a key={item.key} className={active === item.key ? "active" : ""} href={item.href} aria-current={active === item.key ? "page" : undefined}>{body}</a> : <button key={item.key} className="navPending" type="button" title="接入正式后端后开放">{body}</button>;
          })}
        </div>)}
      </nav>
      <div className="adminUser">
        <b>J</b><div><strong>Jack 管理员</strong><small>jack67000000@gmail.com</small></div><a href="/admin/login" title="退出后台">↪</a>
      </div>
    </aside>
  );
}
