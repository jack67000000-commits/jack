"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import catalog from "../../game-catalog.json";
import AdminSidebar from "../AdminSidebar";
import { supabase } from "../../lib/supabase";
import "../admin.css";
import "./games.css";

type CatalogGame = { game_id: number; name: string; game_slug: string; img_url: string; gplat_name: string; target_url?: string; link?: string };
type RedirectSettings = { default_url?: string; published_url?: string; provider_urls?: Record<string, string> };
type Game = {
  id: number;
  slug: string;
  name: string;
  nameZh: string;
  provider: string;
  image: string;
  confidence: number;
  online: boolean;
  users: number;
  rounds: number;
  link: string;
  targetUrl: string | null;
  sortOrder: number;
};

const providers = ["全部", "Tada Gaming", "King Game", "PG Soft", "Rectangle", "Pragmatic Play", "Evoplay"];
const baseGames: Game[] = (catalog as CatalogGame[]).map((item, index) => ({
  id: item.game_id,
  slug: item.game_slug,
  name: item.name,
  nameZh: "",
  provider: item.gplat_name,
  image: item.img_url,
  confidence: Number((52 + (item.game_id % 2100) / 100).toFixed(2)),
  online: true,
  users: 1200 + (item.game_id % 1800),
  rounds: 150000 + (item.game_id % 230000),
  link: item.target_url || item.link || "",
  targetUrl: null,
  sortOrder: index,
}));

function effectiveLink(game: Game, settings: RedirectSettings) {
  return game.targetUrl
    || settings.provider_urls?.[game.provider]
    || (game.online ? settings.published_url : "")
    || settings.default_url
    || game.link
    || "https://winking.game/";
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>(baseGames);
  const [provider, setProvider] = useState("全部");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [deleting, setDeleting] = useState<Game | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [redirects, setRedirects] = useState<RedirectSettings>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadGames = useCallback(async () => {
    const [{ data: rows, error: gamesError }, { data: settings }] = await Promise.all([
      supabase.from("winking_games").select("id,slug,name_es,name_zh,provider,image_url,target_url,confidence,online_users,rounds,enabled,sort_order"),
      supabase.from("winking_settings").select("value").eq("key", "redirects").maybeSingle(),
    ]);

    if (gamesError) {
      setError("读取游戏数据失败：" + gamesError.message);
      return;
    }

    const nextRedirects = (settings?.value ?? {}) as RedirectSettings;
    const overrideRows = (rows ?? []) as any[];
    const byId = new Map<number, any>(overrideRows.map((row) => [Number(row.id), row]));
    const baseIds = new Set(baseGames.map((game) => game.id));

    const merged = baseGames.map((game) => {
      const row = byId.get(game.id);
      const next = {
        ...game,
        slug: row?.slug || game.slug,
        name: row?.name_es || game.name,
        nameZh: row?.name_zh || "",
        provider: row?.provider || game.provider,
        image: row?.image_url || game.image,
        targetUrl: row?.target_url || null,
        confidence: row?.confidence == null ? game.confidence : Number(row.confidence),
        users: row?.online_users ?? game.users,
        rounds: row?.rounds ?? game.rounds,
        online: row?.enabled ?? true,
        sortOrder: row?.sort_order ?? game.sortOrder,
      };
      return { ...next, link: effectiveLink(next, nextRedirects) };
    });

    const extras = overrideRows.filter((row) => !baseIds.has(Number(row.id))).map((row, index) => {
      const next: Game = {
        id: Number(row.id),
        slug: row.slug || "custom-" + row.id,
        name: row.name_es || row.name_zh || "新游戏",
        nameZh: row.name_zh || "",
        provider: row.provider || "其他",
        image: row.image_url || "/games/fortune-pig.jpg",
        targetUrl: row.target_url || null,
        confidence: Number(row.confidence ?? 60),
        users: row.online_users ?? 1000,
        rounds: Number(row.rounds ?? 0),
        online: row.enabled ?? true,
        sortOrder: row.sort_order ?? baseGames.length + index,
        link: "",
      };
      return { ...next, link: effectiveLink(next, nextRedirects) };
    });

    setRedirects(nextRedirects);
    setGames([...merged, ...extras].sort((a, b) => a.sortOrder - b.sortOrder));
  }, []);

  useEffect(() => {
    void loadGames();
    const channel = supabase.channel("winking-admin-games")
      .on("postgres_changes", { event: "*", schema: "public", table: "winking_games" }, () => void loadGames())
      .on("postgres_changes", { event: "*", schema: "public", table: "winking_settings" }, () => void loadGames())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadGames]);

  const shown = useMemo(
    () => games.filter((game) => (provider === "全部" || game.provider === provider) && game.name.toLowerCase().includes(query.toLowerCase())),
    [games, provider, query],
  );

  const resetImage = () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
  };

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("图片只支持 JPG、PNG 或 WEBP。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片不能超过 5MB。");
      return;
    }
    resetImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (gameId: number, fallback: string) => {
    if (!imageFile) return fallback;
    const extension = imageFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const path = "games/" + gameId + "-" + Date.now() + "." + extension;
    const { error: uploadError } = await supabase.storage.from("winking-games").upload(path, imageFile, { cacheControl: "31536000", upsert: false });
    if (uploadError) throw uploadError;
    return supabase.storage.from("winking-games").getPublicUrl(path).data.publicUrl;
  };

  const saveGame = async (event: FormEvent<HTMLFormElement>, game: Game) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);

    try {
      const imageUrl = await uploadImage(game.id, game.image);
      const inputLink = String(form.get("link") ?? "").trim();
      const globalLink = effectiveLink({ ...game, targetUrl: null }, redirects);
      const row = {
        id: game.id,
        slug: game.slug,
        name_es: String(form.get("name") ?? "").trim(),
        name_zh: String(form.get("nameZh") ?? "").trim() || null,
        provider: String(form.get("provider") ?? ""),
        image_url: imageUrl,
        target_url: !inputLink || inputLink === globalLink ? null : inputLink,
        confidence: Number(form.get("confidence")),
        online_users: Number(form.get("users")),
        rounds: Number(form.get("rounds")),
        enabled: form.get("enabled") === "on",
        sort_order: game.sortOrder,
        updated_at: new Date().toISOString(),
      };
      const { error: saveError } = await supabase.from("winking_games").upsert(row, { onConflict: "id" });
      if (saveError) throw saveError;
      await supabase.from("winking_audit_logs").insert({ action: "update_game", entity_type: "game", entity_id: String(game.id), details: { name: row.name_es } });
      setNotice("已保存，前台会自动同步更新。");
      setEditing(null);
      resetImage();
      await loadGames();
    } catch (saveError) {
      setError("保存失败：" + (saveError instanceof Error ? saveError.message : "未知错误"));
    } finally {
      setBusy(false);
    }
  };

  const addGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Date.now();
    const shell: Game = { id, slug: "custom-" + id, name: "", nameZh: "", provider: "", image: "/games/fortune-pig.jpg", confidence: 60, online: true, users: 1000, rounds: 0, link: "", targetUrl: null, sortOrder: games.length + 1 };
    await saveGame(event, shell);
    setAddOpen(false);
  };

  const disableGame = async (game: Game) => {
    setBusy(true);
    setError("");
    const { error: saveError } = await supabase.from("winking_games").upsert({
      id: game.id, slug: game.slug, name_es: game.name, name_zh: game.nameZh || null, provider: game.provider,
      image_url: game.image, target_url: game.targetUrl, confidence: game.confidence, online_users: game.users,
      rounds: game.rounds, enabled: false, sort_order: game.sortOrder, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (saveError) setError("下架失败：" + saveError.message);
    else {
      setNotice("游戏已下架，前台会自动隐藏。");
      setDeleting(null);
      await loadGames();
    }
    setBusy(false);
  };

  const openEditor = (game: Game) => {
    resetImage();
    setEditing(game);
  };

  const currentDefault = redirects.default_url || "https://winking.game/";

  return (
    <div className="adminShell">
      <AdminSidebar active="games" />
      <main className="content gamesContent">
        <header>
          <div><small>管理后台 / 游戏管理</small><h1>游戏管理</h1><p>保存后，名称、图片、数值、状态和跳转链接会同步到前台。</p></div>
          <div className="headActions"><a href="/">查看前台 →</a><button onClick={() => { resetImage(); setAddOpen(true); }}>＋ 新增游戏</button></div>
        </header>

        {error && <div className="adminMessage error">! {error}</div>}
        {notice && <div className="adminMessage success">✓ {notice}</div>}

        <section className="gameSummary">
          <span><b>{games.length}</b><small>全部游戏</small></span>
          <span><b>{games.filter((game) => game.online).length}</b><small>已上架</small></span>
          <span><b>{games.filter((game) => !game.online).length}</b><small>已下架</small></span>
          <span><b>{new Set(games.map((game) => game.provider)).size}</b><small>供应商</small></span>
        </section>

        <section className="catalog">
          <div className="catalogTop">
            <label>⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索游戏名称" /></label>
            <button onClick={() => void loadGames()}>同步最新数据</button>
            <button onClick={() => { window.location.href = "/admin/links"; }}>统一跳转链接</button>
          </div>
          <div className="linkSyncNotice">当前统一链接：<b>{currentDefault}</b><span>保存修改后前台自动更新</span></div>
          <div className="providerTabs">{providers.map((item) => <button key={item} className={item === provider ? "on" : ""} onClick={() => setProvider(item)}>{item}</button>)}</div>
          <div className="gameGrid">
            {shown.map((game) => (
              <article key={game.id}>
                <div className="gamePic"><img src={game.image} alt={game.name} /><span className={game.online ? "online" : "offline"}>{game.online ? "已上架" : "已下架"}</span></div>
                <div className="gameMeta"><small>{game.provider}</small><h3>{game.name}</h3><div><span>置信度 <b>{game.confidence}%</b></span><i><b style={{ width: game.confidence + "%" }} /></i></div></div>
                <footer><button onClick={() => window.open(game.link, "_blank", "noopener,noreferrer")}>预览</button><button onClick={() => openEditor(game)}>编辑</button><button className="deleteGame" onClick={() => setDeleting(game)}>下架</button></footer>
              </article>
            ))}
          </div>
          <div className="catalogFoot"><span>当前显示 {shown.length} 款，游戏总数 {games.length}</span></div>
        </section>
      </main>

      {addOpen && (
        <div className="backdrop" onMouseDown={() => setAddOpen(false)}>
          <form className="modal gameModal" onSubmit={addGame} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modalClose" onClick={() => setAddOpen(false)}>×</button><small>游戏管理</small><h2>新增游戏</h2>
            <GameFields game={{ ...baseGames[0], name: "", nameZh: "", confidence: 60, users: 1000, rounds: 0, link: currentDefault }} imagePreview={imagePreview} chooseImage={chooseImage} />
            <div className="modalActions"><button type="button" onClick={() => setAddOpen(false)}>取消</button><button className="save" type="submit" disabled={busy}>创建并同步</button></div>
          </form>
        </div>
      )}

      {editing && (
        <div className="backdrop" onMouseDown={() => setEditing(null)}>
          <form className="modal gameModal" onSubmit={(event) => void saveGame(event, editing)} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modalClose" onClick={() => setEditing(null)}>×</button><small>游戏管理</small><h2>编辑游戏</h2>
            <GameFields game={editing} imagePreview={imagePreview} chooseImage={chooseImage} />
            <small className="linkHelp">保存后，已打开的前台页面也会自动读取最新数据。</small>
            <div className="modalActions"><button type="button" onClick={() => setEditing(null)}>取消</button><button className="save" type="submit" disabled={busy}>{busy ? "正在保存…" : "保存并同步"}</button></div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="backdrop" onMouseDown={() => setDeleting(null)}>
          <div className="modal deleteModal" onMouseDown={(event) => event.stopPropagation()}>
            <span className="dangerIcon">!</span><small>下架警告</small><h2>确认下架这款游戏？</h2><p>下架后前台会自动隐藏，但数据会保留，之后仍可重新编辑并上架。</p>
            <div className="deleteTarget"><img src={deleting.image} alt="" /><span><b>{deleting.name}</b><small>{deleting.provider}</small></span></div>
            <div className="modalActions"><button onClick={() => setDeleting(null)}>取消</button><button className="dangerButton" disabled={busy} onClick={() => void disableGame(deleting)}>确认下架</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function GameFields({ game, imagePreview, chooseImage }: { game: Game; imagePreview: string; chooseImage: (file?: File) => void }) {
  return (
    <>
      <div className="imagePicker compact"><img src={imagePreview || game.image} alt="游戏封面预览" /><label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} />更换图片</label></div>
      <div className="formPair">
        <label>前台西班牙语名称<input name="name" defaultValue={game.name} required /></label>
        <label>后台中文名称<input name="nameZh" defaultValue={game.nameZh} placeholder="可选" /></label>
      </div>
      <div className="formPair">
        <label>游戏供应商<select name="provider" defaultValue={game.provider}>{providers.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="statusCheck">前台状态<span><input name="enabled" type="checkbox" defaultChecked={game.online} /> 上架显示</span></label>
      </div>
      <div className="formPair">
        <label>预测置信度<input name="confidence" type="number" min="0" max="100" step=".01" defaultValue={game.confidence} required /></label>
        <label>在线人数<input name="users" type="number" min="0" defaultValue={game.users} required /></label>
      </div>
      <label>样本局数<input name="rounds" type="number" min="0" defaultValue={game.rounds} required /></label>
      <label>前台跳转链接<input name="link" type="url" defaultValue={game.link} placeholder="https://example.com/game" /></label>
    </>
  );
}
