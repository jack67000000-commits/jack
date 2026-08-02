"use client";

import AdminSidebar from "./AdminSidebar";
import "./admin.css";

const providers = [
  ["TADA", "Tada Gaming", "104"], ["KING", "King Game", "14"], ["PG", "PG Soft", "122"],
  ["RECT", "Rectangle", "38"], ["PP", "Pragmatic Play", "290"], ["EVO", "Evoplay", "87"],
];

const games = [
  ["Fortune Gems 2", "Tada Gaming", "/games/fortune-pig.jpg", "1,870", "68.45%", true],
  ["Fever Gems2", "King Game", "/games/fever-gems2.jpg", "2,125", "61.78%", true],
  ["Graffiti Rush", "PG Soft", "/games/graffiti-rush.jpg", "2,029", "64.32%", true],
  ["Aztec Gems", "Pragmatic Play", "/games/aztec-gems.jpg", "1,810", "54.97%", false],
] as const;

export default function AdminPage() {
  return <div className="adminShell">
    <AdminSidebar active="dashboard" />
    <main className="content">
      <header><div><small>管理后台 / 数据总览</small><h1>早上好，Jack</h1><p>这里是游戏预测平台的实时运营概况。</p></div><div className="headActions"><a href="/">查看前台 ↗</a><a className="button primary" href="/admin/games">＋ 新增游戏</a></div></header>
      <section className="stats">
        {[['游戏总数','595','+18 本周新增','▦'],['已上架游戏','548','92.1% 上架率','✓'],['今日在线人数','24,217','+8.6% 较昨日','⌁'],['平均置信度','63.2%','+1.4% 近 7 天','↗']].map((item)=><article key={item[0]}><div><small>{item[0]}</small><strong>{item[1]}</strong><p>{item[2]}</p></div><b className="statIcon">{item[3]}</b></article>)}
      </section>
      <section className="panel"><div className="panelHead"><div><h2>供应商概览</h2><p>查看已接入游戏数量与配置状态</p></div></div><div className="providers">{providers.map((item)=><button className="providerCard" key={item[1]}><b>{item[0]}</b><span><strong>{item[1]}</strong><small>{item[2]} 款游戏</small></span></button>)}</div></section>
      <section className="panel"><div className="panelHead"><div><h2>最近游戏</h2><p>修改图片、名称、预测参数和跳转地址</p></div><a className="button" href="/admin/games">管理全部游戏 →</a></div><div className="dataTable"><div className="tableHead"><span>游戏信息</span><span>供应商</span><span>在线人数</span><span>预测置信度</span><span>状态</span><span>操作</span></div>{games.map((game)=><div className="tableRow" key={game[0]}><div className="identity"><img src={game[2]} alt=""/><span><b>{game[0]}</b><small>WINKING GAME</small></span></div><span className="pill">{game[1]}</span><b>{game[3]}</b><b>{game[4]}</b><span className={game[5]?"status on":"status off"}>● {game[5]?"已上架":"已下架"}</span><div className="tableActions"><a className="button" href="/admin/games">编辑</a></div></div>)}</div></section>
    </main>
  </div>;
}
