"use client";

import { FormEvent, useMemo, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "./games.css";

type Game = { name:string; provider:string; image:string; confidence:number; online:boolean; users:number; link:string };
const providers=["全部","Tada Gaming","King Game","PG Soft","Rectangle","Pragmatic Play","Evoplay"];
const seed:Game[]=[
  {name:"Fortune Gems 2",provider:"Tada Gaming",image:"/games/fortune-pig.jpg",confidence:68.45,online:true,users:1870,link:"https://winking.game/"},
  {name:"Fever Gems2",provider:"King Game",image:"/games/fever-gems2.jpg",confidence:61.78,online:true,users:2125,link:"https://winking.game/"},
  {name:"Graffiti Rush",provider:"PG Soft",image:"/games/graffiti-rush.jpg",confidence:64.32,online:true,users:2029,link:"https://winking.game/"},
  {name:"Fortune Pig",provider:"Rectangle",image:"/games/fortune-pig.jpg",confidence:66.04,online:true,users:2641,link:"https://winking.game/"},
  {name:"Aztec Gems",provider:"Pragmatic Play",image:"/games/aztec-gems.jpg",confidence:54.97,online:false,users:1810,link:"https://winking.game/"},
  {name:"Sweet Sugar",provider:"Evoplay",image:"/games/sweet-sugar.jpg",confidence:69.82,online:true,users:2207,link:"https://winking.game/"},
  {name:"BigWolf",provider:"PG Soft",image:"/games/bigwolf.jpg",confidence:65.28,online:true,users:1980,link:"https://winking.game/"},
  {name:"Red Hot Luck",provider:"Pragmatic Play",image:"/games/red-hot-luck.jpg",confidence:60.47,online:true,users:1756,link:"https://winking.game/"},
];

export default function GamesPage(){
  const[games,setGames]=useState(seed),[provider,setProvider]=useState("全部"),[query,setQuery]=useState(""),[addOpen,setAddOpen]=useState(false),[editing,setEditing]=useState<Game|null>(null),[deleting,setDeleting]=useState<Game|null>(null),[image,setImage]=useState("");
  const shown=useMemo(()=>games.filter((game)=>(provider==="全部"||game.provider===provider)&&game.name.toLowerCase().includes(query.toLowerCase())),[games,provider,query]);
  const loadImage=(file?:File)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>setImage(String(reader.result));reader.readAsDataURL(file)};
  const saveEdit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!editing)return;const data=new FormData(event.currentTarget);setGames((current)=>current.map((game)=>game.name===editing.name?{...game,name:String(data.get("name")),provider:String(data.get("provider")),confidence:Number(data.get("confidence")),users:Number(data.get("users")),link:String(data.get("link")),image:image||game.image}:game));setEditing(null);setImage("")};
  return <div className="adminShell"><AdminSidebar active="games"/><main className="content gamesContent">
    <header><div><small>管理后台 / 游戏管理</small><h1>游戏管理</h1><p>管理游戏资料、图片、预测参数、跳转链接及前台状态。</p></div><div className="headActions"><a href="/">查看前台 ↗</a><button onClick={()=>{setImage("");setAddOpen(true)}}>＋ 新增游戏</button></div></header>
    <section className="gameSummary"><span><b>595</b><small>全部游戏</small></span><span><b>548</b><small>已上架</small></span><span><b>47</b><small>已下架</small></span><span><b>6</b><small>供应商</small></span></section>
    <section className="catalog"><div className="catalogTop"><label>⌕<input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="搜索游戏名称"/></label><button>⇩ 批量导入</button><button onClick={()=>{window.location.href="/admin/links"}}>⟶ 统一跳转链接</button></div><div className="providerTabs">{providers.map((item)=><button key={item} className={item===provider?"on":""} onClick={()=>setProvider(item)}>{item}</button>)}</div>
      <div className="gameGrid">{shown.map((game)=><article key={game.name}><div className="gamePic"><img src={game.image} alt={game.name}/><span className={game.online?"online":"offline"}>{game.online?"已上架":"已下架"}</span></div><div className="gameMeta"><small>{game.provider}</small><h3>{game.name}</h3><div><span>置信度 <b>{game.confidence}%</b></span><i><b style={{width:game.confidence+"%"}}/></i></div></div><footer><button>预览</button><button onClick={()=>{setEditing(game);setImage("")}}>编辑</button><button className="deleteGame" onClick={()=>setDeleting(game)}>删除</button></footer></article>)}</div>
      <div className="catalogFoot"><span>当前显示 {shown.length} 款，游戏总数 595</span><div><button>‹</button><button className="on">1</button><button>2</button><button>3</button><button>›</button></div></div>
    </section>
  </main>
  {addOpen&&<div className="backdrop" onMouseDown={()=>setAddOpen(false)}><div className="modal gameModal" onMouseDown={(event)=>event.stopPropagation()}><button className="modalClose" onClick={()=>setAddOpen(false)}>×</button><small>游戏管理</small><h2>新增游戏</h2><p className="formHint">填写游戏资料后即可创建，后续仍可随时修改。</p><div className="imagePicker">{image?<img src={image} alt="新游戏封面预览"/>:<div><b>图</b><span>上传游戏封面</span><small>建议 1:1，JPG / PNG / WEBP</small></div>}<label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>loadImage(event.target.files?.[0])}/>{image?"重新选择":"选择图片"}</label></div><div className="formPair"><label>中文管理名称<input placeholder="后台使用名称"/></label><label>西班牙语名称<input placeholder="前台显示名称"/></label></div><div className="formPair"><label>游戏供应商<select><option>请选择</option>{providers.slice(1).map((item)=><option key={item}>{item}</option>)}</select></label><label>初始置信度<input type="number" defaultValue="60.00"/></label></div><label>前台跳转链接<input placeholder="https://winking.game/game/..."/></label><div className="modalActions"><button onClick={()=>setAddOpen(false)}>取消</button><button className="save" onClick={()=>setAddOpen(false)}>创建游戏</button></div></div></div>}
  {editing&&<div className="backdrop" onMouseDown={()=>setEditing(null)}><form className="modal gameModal" onSubmit={saveEdit} onMouseDown={(event)=>event.stopPropagation()}><button type="button" className="modalClose" onClick={()=>setEditing(null)}>×</button><small>游戏管理</small><h2>编辑游戏</h2><div className="imagePicker compact"><img src={image||editing.image} alt="游戏封面预览"/><label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>loadImage(event.target.files?.[0])}/>更换图片</label></div><div className="formPair"><label>前台显示名称<input name="name" defaultValue={editing.name}/></label><label>游戏供应商<select name="provider" defaultValue={editing.provider}>{providers.slice(1).map((item)=><option key={item}>{item}</option>)}</select></label></div><div className="formPair"><label>预测置信度<input name="confidence" type="number" step=".01" defaultValue={editing.confidence}/></label><label>在线人数<input name="users" type="number" defaultValue={editing.users}/></label></div><label>前台跳转链接<input name="link" defaultValue={editing.link}/></label><div className="modalActions"><button type="button" onClick={()=>setEditing(null)}>取消</button><button className="save" type="submit">保存修改</button></div></form></div>}
  {deleting&&<div className="backdrop" onMouseDown={()=>setDeleting(null)}><div className="modal deleteModal" onMouseDown={(event)=>event.stopPropagation()}><span className="dangerIcon">!</span><small>删除警告</small><h2>确认删除这款游戏？</h2><p>删除后将从前台移除，相关预测参数也会一并删除，此操作无法撤销。</p><div className="deleteTarget"><img src={deleting.image} alt=""/><span><b>{deleting.name}</b><small>{deleting.provider}</small></span></div><div className="modalActions"><button onClick={()=>setDeleting(null)}>取消</button><button className="dangerButton" onClick={()=>{setGames((current)=>current.filter((game)=>game.name!==deleting.name));setDeleting(null)}}>确认删除</button></div></div></div>}
  </div>;
}
