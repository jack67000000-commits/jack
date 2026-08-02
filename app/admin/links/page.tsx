"use client";

import { FormEvent, useMemo, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "./links.css";

const providers = [
  { name: "Tada Gaming", count: 104 },
  { name: "King Game", count: 14 },
  { name: "PG Soft", count: 122 },
  { name: "Rectangle", count: 38 },
  { name: "Pragmatic Play", count: 290 },
  { name: "Evoplay", count: 86 },
];

type Scope = "all" | "published" | "provider";

export default function LinksPage() {
  const [currentLink, setCurrentLink] = useState("https://winking.game/");
  const [nextLink, setNextLink] = useState("https://winking.game/");
  const [scope, setScope] = useState<Scope>("all");
  const [provider, setProvider] = useState(providers[0].name);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([
    { time: "今天 09:18", scope: "全部游戏", link: "https://winking.game/" },
  ]);

  const affectedCount = useMemo(() => {
    if (scope === "published") return 607;
    if (scope === "provider") {
      return providers.find((item) => item.name === provider)?.count ?? 0;
    }
    return 654;
  }, [provider, scope]);

  const applyLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    let url: URL;
    try {
      url = new URL(nextLink.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      setError("请输入以 http:// 或 https:// 开头的有效链接。");
      return;
    }

    if (!confirmed) {
      setError("请先确认更新范围和目标链接。");
      return;
    }

    const normalized = url.toString();
    const scopeLabel =
      scope === "all"
        ? "全部游戏"
        : scope === "published"
          ? "全部已上架游戏"
          : provider;

    setCurrentLink(normalized);
    setNextLink(normalized);
    setHistory((items) => [
      { time: "刚刚", scope: scopeLabel, link: normalized },
      ...items,
    ]);
    setMessage("已完成界面预览：" + affectedCount + " 款游戏的跳转链接已统一更新。");
    setConfirmed(false);
  };

  return (
    <div className="adminShell">
      <AdminSidebar active="links" />
      <main className="content linksContent">
        <header>
          <div>
            <small>管理后台 / 运营设置 / 跳转链接</small>
            <h1>一键更改跳转链接</h1>
            <p>统一修改全部游戏、已上架游戏或指定供应商的跳转地址。</p>
          </div>
          <div className="headActions">
            <a href="/admin/games">返回游戏管理</a>
            <a href="/" target="_blank" rel="noreferrer">查看前台 ↗</a>
          </div>
        </header>

        <section className="linkOverview">
          <article>
            <small>当前默认跳转链接</small>
            <strong>{currentLink}</strong>
            <span><i /> 正常可用</span>
          </article>
          <article>
            <small>游戏总数</small>
            <strong>654</strong>
            <span>覆盖 6 家供应商</span>
          </article>
          <article>
            <small>已上架游戏</small>
            <strong>607</strong>
            <span>可单独批量更新</span>
          </article>
        </section>

        <div className="linkColumns">
          <form className="linkPanel" onSubmit={applyLink}>
            <div className="linkPanelHead">
              <span>01</span>
              <div><h2>选择更新范围</h2><p>默认一键应用到全部 654 款游戏。</p></div>
            </div>

            <div className="scopeGrid">
              <label className={scope === "all" ? "selected" : ""}>
                <input type="radio" name="scope" checked={scope === "all"} onChange={() => setScope("all")} />
                <b>全部游戏</b><span>654 款</span><small>推荐</small>
              </label>
              <label className={scope === "published" ? "selected" : ""}>
                <input type="radio" name="scope" checked={scope === "published"} onChange={() => setScope("published")} />
                <b>仅已上架</b><span>607 款</span>
              </label>
              <label className={scope === "provider" ? "selected" : ""}>
                <input type="radio" name="scope" checked={scope === "provider"} onChange={() => setScope("provider")} />
                <b>指定供应商</b><span>按分类更新</span>
              </label>
            </div>

            {scope === "provider" && (
              <label className="fieldLabel">
                选择供应商
                <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                  {providers.map((item) => <option key={item.name} value={item.name}>{item.name}（{item.count} 款）</option>)}
                </select>
              </label>
            )}

            <div className="linkPanelHead second">
              <span>02</span>
              <div><h2>输入新的跳转链接</h2><p>只支持完整的 HTTP 或 HTTPS 地址。</p></div>
            </div>

            <label className="fieldLabel">
              新跳转链接
              <div className="urlInput"><span>↗</span><input type="url" value={nextLink} onChange={(event) => setNextLink(event.target.value)} placeholder="https://example.com/" required /></div>
            </label>

            <div className="changePreview">
              <div><small>更新范围</small><b>{affectedCount} 款游戏</b></div>
              <span>→</span>
              <div><small>更新后地址</small><b>{nextLink || "尚未填写"}</b></div>
            </div>

            <label className="confirmRow">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>我已确认更新范围和目标链接正确。</span>
            </label>

            {error && <div className="linkAlert error">! {error}</div>}
            {message && <div className="linkAlert success">✓ {message}</div>}

            <button className="applyAll" type="submit">
              一键应用到 {affectedCount} 款游戏 <span>→</span>
            </button>
            <p className="demoNotice">当前为界面功能预览。正式数据库接入后，保存会永久生效并同步到公开前台。</p>
          </form>

          <aside className="linkSidePanel">
            <section>
              <h2>供应商覆盖</h2>
              <p>可查看每家供应商将受影响的游戏数量。</p>
              <div className="providerList">
                {providers.map((item) => <div key={item.name}><span><i />{item.name}</span><b>{item.count}</b></div>)}
              </div>
            </section>
            <section>
              <h2>最近操作</h2>
              <div className="linkHistory">
                {history.map((item, index) => <article key={item.time + index}><span>{item.time}</span><b>{item.scope}</b><small>{item.link}</small></article>)}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
