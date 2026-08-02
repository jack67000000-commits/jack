"use client";

import { useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "./system.css";

const logs=[
  ["错误","今天 10:42","图片上传服务","文件响应超时，已自动重试","IMG-408"],
  ["警告","今天 09:18","预测数据同步","3 款游戏数据延迟超过 5 分钟","SYNC-102"],
  ["已恢复","昨天 21:06","数据库连接","短暂连接中断，12 秒后恢复","DB-001"],
];

export default function SystemPage(){const[tab,setTab]=useState("运行状态");return <div className="adminShell"><AdminSidebar active="system"/><main className="content systemContent">
  <header><div><small>管理后台 / 系统维护</small><h1>系统维护中心</h1><p>查看运行状态、错误日志、操作记录和数据备份。</p></div><div className="headActions"><button>↻ 立即检查</button></div></header>
  <section className="health">{[["前端网站","运行正常","响应时间 128ms","在线"],["后端接口","演示模式","正式后端待接入","演示"],["数据库","尚未连接","数据当前不持久化","待接入"],["图片存储","本地预览","发布前接入云存储","本地"]].map((item,index)=><article key={item[0]}><span className={index===0?"healthIcon ok":"healthIcon wait"}>{index===0?"✓":"!"}</span><div><small>{item[0]}</small><b>{item[1]}</b><p>{item[2]}</p></div><i>{item[3]}</i></article>)}</section>
  <section className="systemPanel"><div className="systemTabs">{["运行状态","错误日志","操作记录","备份与恢复","版本信息"].map((item)=><button key={item} className={tab===item?"on":""} onClick={()=>setTab(item)}>{item}</button>)}</div>
    {tab==="运行状态"&&<div className="statusView"><div className="metricChart"><div><h2>本地预览可用率</h2><strong>100%</strong></div><div className="bars">{[58,72,68,81,74,88,79,92,83,89,94,87,91,96,92,95,90,94,97,92,96,94,98,95].map((height,index)=><i key={index} style={{height:height+"%"}}/>)}</div></div><div className="maintenance"><h2>快速维护</h2><button><b>导出配置</b><span>保存游戏与界面配置</span><i>→</i></button><button><b>查看错误报告</b><span>提供给开发人员排查</span><i>→</i></button><button><b>检查新版本</b><span>发布后连接 GitHub 版本</span><i>→</i></button></div></div>}
    {tab==="错误日志"&&<div className="logTable"><div className="logHead"><span>级别</span><span>时间</span><span>功能位置</span><span>错误说明</span><span>代码</span></div>{logs.map((item)=><div className="logRow" key={item[4]}><span className={"logLevel "+item[0]}>{item[0]}</span><span>{item[1]}</span><b>{item[2]}</b><span>{item[3]}</span><code>{item[4]}</code></div>)}</div>}
    {!["运行状态","错误日志"].includes(tab)&&<div className="placeholder"><b>{tab}</b><p>接入正式后端与数据库后，这里将显示真实记录和可操作内容。</p></div>}
  </section>
  </main></div>}
