type AdminSection = "dashboard" | "games" | "admins" | "system";

type AdminSidebarProps = {
  active: AdminSection;
};

const navigation = [
  {
    label: "工作台",
    items: [
      { key: "dashboard", href: "/admin", icon: "⌂", label: "数据总览" },
      { key: "games", href: "/admin/games", icon: "▦", label: "游戏管理", badge: "595" },
      { key: "providers", icon: "◫", label: "供应商管理", badge: "6", pending: true },
    ],
  },
  {
    label: "运营设置",
    items: [
      { key: "forecast", icon: "↗", label: "预测参数", pending: true },
      { key: "links", icon: "⌁", label: "跳转链接", pending: true },
      { key: "ranking", icon: "☷", label: "排序与推荐", pending: true },
    ],
  },
  {
    label: "系统",
    items: [
      { key: "admins", href: "/admin/admins", icon: "♙", label: "管理员", badge: "3" },
      { key: "system", href: "/admin/system", icon: "⚙", label: "系统维护" },
    ],
  },
] as const;

export default function AdminSidebar({ active }: AdminSidebarProps) {
  return (
    <aside className="side">
      <a className="adminLogo" href="/admin" aria-label="返回后台数据总览">
        <img src="/winking-logo.png" alt="Winking.Game" />
      </a>

      <div className="workspace">
        <div className="workspaceTop">
          <small>当前工作区</small>
          <i>演示版</i>
        </div>
        <b>Winking 预测平台</b>
        <span><i /> 本地预览运行正常</span>
      </div>

      <nav aria-label="后台主导航">
        {navigation.map((group) => (
          <div className="navGroup" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => {
              const isActive = item.key === active;
              const content = (
                <>
                  <span className="navIcon" aria-hidden="true">{item.icon}</span>
                  <span className="navLabel">{item.label}</span>
                  {"badge" in item && <i className="navBadge">{item.badge}</i>}
                  {"pending" in item && item.pending && <em>即将开放</em>}
                </>
              );

              if ("href" in item && item.href) {
                return (
                  <a
                    key={item.key}
                    className={isActive ? "active" : ""}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {content}
                  </a>
                );
              }

              return <button key={item.key} type="button" className="navPending" title="该功能将在后端接入后开放">{content}</button>;
            })}
          </div>
        ))}
      </nav>

      <div className="user">
        <b aria-hidden="true">管</b>
        <div>
          <strong>超级管理员</strong>
          <small>admin@winking.game</small>
        </div>
        <a href="/admin/login" title="退出后台" aria-label="退出后台">↪</a>
      </div>
    </aside>
  );
}
