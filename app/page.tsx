"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import catalog from "./game-catalog.json";
import { hasSupabaseConfig, supabase } from "./lib/supabase";

type Game = {
  id: number;
  name: string;
  type: string;
  provider: string;
  icon: string;
  imageUrl?: string;
  link?: string;
  enabled?: boolean;
  color: string;
  players: number;
  rounds: number;
  score: number;
  trend: number[];
  prizes: number[];
};

type CatalogGame = {
  game_id: number;
  name: string;
  game_slug: string;
  img_url: string;
  gplat_name: string;
  target_url?: string;
  link?: string;
};

type RedirectValue = {
  default_url?: string;
  published_url?: string;
  provider_urls?: Record<string, string>;
};

type SwipePoint = {
  x: number;
  y: number;
  time: number;
};

const palette = ["#8b5cf6", "#f97316", "#eab308", "#ec4899", "#22c55e", "#3b82f6", "#ef4444", "#06b6d4", "#f43f5e"];

const games: Game[] = (catalog as CatalogGame[]).map((item, index) => {
  const seed = item.game_id;
  const base = 46 + (seed % 17);

  return {
    id: seed,
    name: item.name,
    type: "Tragamonedas",
    provider: item.gplat_name,
    icon: item.name.slice(0, 2).toUpperCase(),
    imageUrl: item.img_url,
    link: item.target_url || item.link || `https://winking.games/game/${item.game_slug}`,
    color: palette[index % palette.length],
    players: 1200 + (seed % 1800),
    rounds: 150000 + (seed % 230000),
    score: Number((52 + (seed % 2100) / 100).toFixed(2)),
    trend: [
      base,
      Math.min(76, base + (seed % 11)),
      Math.max(28, base - (seed % 9)),
      Math.min(77, base + (seed % 14)),
      Math.max(30, base - 3 + (seed % 8)),
      Math.min(78, base + (seed % 16)),
    ],
    prizes: [4500 + (seed % 4200), 2600 + (seed % 1900), 160 + (seed % 180)],
  };
});

function Chart({ g }: { g: Game }) {
  const points = (values: number[]) => values.map((value, index) => `${index * 20},${80 - value}`).join(" ");
  const high = g.trend;
  const mid = g.trend.map((value) => Math.round(value * 0.72 + 6));
  const low = g.trend.map((value) => Math.round(value * 0.43 + 5));

  return (
    <>
      <div className="lineLegend">
        <span><i className="cyan" />Alta</span>
        <span><i className="mint" />Media</span>
        <span><i className="blue" />Baja</span>
      </div>
      <svg key={g.trend.join("-")} className="spark liveSpark" viewBox="0 0 100 42" preserveAspectRatio="none">
        <path d="M0 10H100M0 24H100M0 38H100" className="gridline" />
        <polyline points={points(high)} fill="none" stroke="#16c7e6" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points(mid)} fill="none" stroke="#4fd49a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points(low)} fill="none" stroke="#1b69d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="days">{["Lun", "Mar", "Mié", "Jue", "Vie", "Hoy"].map((day) => <span key={day}>{day}</span>)}</div>
    </>
  );
}

export default function Home() {
  const [tab, setTab] = useState("Todos");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Recomendados");
  const [liveGames, setLiveGames] = useState(games);
  const [page, setPage] = useState(0);
  const [isMobileCardMode, setIsMobileCardMode] = useState(false);
  const holdTimer = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const swipeStart = useRef<SwipePoint | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px), (pointer: coarse) and (max-width: 900px)");
    const sync = () => setIsMobileCardMode(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let cancelled = false;
    const loadPublishedConfig = async () => {
      const [{ data: overrides, error: gamesError }, { data: redirects }] = await Promise.all([
        supabase.from("winking_games").select("id,slug,name_es,name_zh,provider,image_url,target_url,confidence,online_users,rounds,enabled,sort_order"),
        supabase.from("winking_settings").select("value").eq("key", "redirects").maybeSingle(),
      ]);
      if (gamesError || cancelled) return;

      const redirectValue = (redirects?.value ?? {}) as RedirectValue;
      const rows = (overrides ?? []) as any[];
      const byId = new Map<number, any>(rows.map((row) => [Number(row.id), row]));
      const baseIds = new Set(games.map((game) => game.id));

      const merged = games.map((game) => {
        const row = byId.get(game.id);
        const provider = row?.provider || game.provider;

        return {
          ...game,
          name: row?.name_es || game.name,
          provider,
          imageUrl: row?.image_url || game.imageUrl,
          link: row?.target_url || redirectValue.provider_urls?.[provider] || redirectValue.published_url || redirectValue.default_url || game.link,
          score: row?.confidence == null ? game.score : Number(row.confidence),
          players: row?.online_users ?? game.players,
          rounds: row?.rounds ?? game.rounds,
          enabled: row?.enabled ?? true,
        };
      });

      const extras = rows
        .filter((row) => !baseIds.has(Number(row.id)))
        .map((row, index) => {
          const seed = Number(row.id);
          const base = 46 + (seed % 17);
          const provider = row.provider || "Otros";

          return {
            id: seed,
            name: row.name_es || row.name_zh || "Juego",
            type: "Tragamonedas",
            provider,
            icon: String(row.name_es || "JG").slice(0, 2).toUpperCase(),
            imageUrl: row.image_url || undefined,
            link: row.target_url || redirectValue.provider_urls?.[provider] || redirectValue.published_url || redirectValue.default_url,
            enabled: row.enabled ?? true,
            color: palette[(games.length + index) % palette.length],
            players: row.online_users ?? 1000,
            rounds: row.rounds ?? 0,
            score: Number(row.confidence ?? 60),
            trend: [base, base + 5, base - 3, base + 7, base + 2, base + 8],
            prizes: [4500 + (seed % 4200), 2600 + (seed % 1900), 160 + (seed % 180)],
          } satisfies Game;
        });

      setLiveGames([...merged, ...extras].filter((game) => game.enabled !== false));
    };

    void loadPublishedConfig();
    const channel = supabase
      .channel("winking-public-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "winking_games" }, () => void loadPublishedConfig())
      .on("postgres_changes", { event: "*", schema: "public", table: "winking_settings" }, () => void loadPublishedConfig())
      .subscribe();

    const refresh = () => void loadPublishedConfig();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveGames((current) => current.map((game) => {
        const delta = (Math.random() - 0.48) * 1.1;
        const last = game.trend.at(-1) ?? 50;

        return {
          ...game,
          players: Math.max(1, game.players + Math.floor((Math.random() - 0.45) * 12)),
          score: Math.min(89.9, Math.max(35, Number((game.score + delta).toFixed(2)))),
          trend: [...game.trend.slice(1), Math.min(78, Math.max(22, Math.round(last + (Math.random() - 0.48) * 7)))],
          prizes: game.prizes.map((value, index) => Math.max(1, value + Math.floor((Math.random() - 0.45) * (index === 0 ? 18 : index === 1 ? 12 : 4)))),
        };
      }));
    }, 1800);

    return () => clearInterval(id);
  }, []);

  const averageScore = useMemo(() => {
    if (!liveGames.length) return "0.0";
    const total = liveGames.reduce((sum, game) => sum + game.score, 0);
    return (total / liveGames.length).toFixed(1);
  }, [liveGames]);

  const shown = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("es-AR");

    return liveGames
      .filter((game) => {
        const matchesProvider = tab === "Todos" || game.provider === tab;
        const matchesSearch = !query || game.name.toLocaleLowerCase("es-AR").includes(query);
        return matchesProvider && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "Mayor confianza") return b.score - a.score;
        if (sort === "Jugadores en línea") return b.players - a.players;
        return a.id - b.id;
      });
  }, [tab, q, sort, liveGames]);

  const pageSize = isMobileCardMode ? 1 : 6;
  const pageCount = Math.ceil(shown.length / pageSize);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const paged = shown.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const dotPages = pageCount <= 7
    ? Array.from({ length: pageCount }, (_, index) => index)
    : Array.from(new Set([0, Math.max(0, safePage - 1), safePage, Math.min(pageCount - 1, safePage + 1), pageCount - 1])).sort((a, b) => a - b);

  const visit = (game: Game) => {
    if (game.link) window.location.assign(game.link);
  };

  const stopHoldPaging = () => {
    if (holdTimer.current) window.clearInterval(holdTimer.current);
    holdTimer.current = null;
  };

  const turnPage = (direction: number) => {
    setPage((current) => {
      const count = Math.max(1, Math.ceil(shown.length / pageSize));
      return (current + direction + count) % count;
    });
  };

  const startHoldPaging = (direction: number) => {
    stopHoldPaging();
    turnPage(direction);
    holdTimer.current = window.setInterval(() => turnPage(direction), 420);
  };

  const handleSwipeEnd = (clientX: number, clientY: number) => {
    if (swipeStart.current == null) return;
    const delta = clientX - swipeStart.current.x;
    const verticalDelta = clientY - swipeStart.current.y;
    const duration = Date.now() - swipeStart.current.time;
    swipeStart.current = null;
    if (duration > 900 || Math.abs(delta) < 46 || Math.abs(delta) < Math.abs(verticalDelta) * 1.15) return;
    turnPage(delta > 0 ? -1 : 1);
  };

  useEffect(() => setPage(0), [tab, q, sort, isMobileCardMode]);
  useEffect(() => stopHoldPaging, []);

  return (
    <main>
      <header>
        <a className="brand logoBrand" href="#top" aria-label="Winking Game"><img src="/winking-logo.png" alt="Winking.Game" /></a>
        <nav><a href="#games">Pronósticos</a><a href="#method">Metodología</a><a href="#notice">Aviso</a></nav>
        <div className="live"><i />Datos en vivo</div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">MODELO IA · ACTUALIZA CADA 5 MIN</div>
        <h1>¿Cómo viene la tendencia?<em>Decidí con más contexto</em></h1>
        <p>Analizamos la actividad reciente para ofrecerte una referencia clara y simple.</p>
        <div className="stats">
          <div><b>{liveGames.length}</b><span>Juegos seguidos</span></div>
          <div><b>{liveGames.reduce((sum, game) => sum + game.players, 0).toLocaleString("es-AR")}</b><span>Jugadores online</span></div>
          <div><b>{averageScore}%</b><span>Confianza promedio</span></div>
        </div>
      </section>

      <section className="board" id="games">
        <div className="controls">
          <div className="tabs">{["Todos", "Tada Gaming", "King Game", "PG Soft", "Rectangle", "Pragmatic Play", "Evoplay"].map((item) => <button key={item} className={tab === item ? "on" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
          <div className="actions">
            <label>⌕<input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar juego" /></label>
            <select value={sort} onChange={(event) => setSort(event.target.value)}><option>Recomendados</option><option>Mayor confianza</option><option>Jugadores en línea</option></select>
          </div>
        </div>

        <div className="title"><div><i /><h2>Pronósticos en vivo</h2><small>{shown.length} juegos</small></div><small>Señales actualizadas en tiempo real</small></div>

        <div
          className="cards mobileSwipe"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY, time: Date.now() } : null;
          }}
          onTouchCancel={() => { swipeStart.current = null; }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            handleSwipeEnd(touch?.clientX ?? 0, touch?.clientY ?? 0);
          }}
        >
          {paged.map((game) => <article key={game.id}>
            <div className="cardhead">
              <div className="icon" style={{ background: `linear-gradient(145deg,${game.color},#111827)` }}>{game.imageUrl ? <img src={game.imageUrl} alt={game.name} /> : game.icon}</div>
              <div className="game"><h3>{game.name}</h3><span><i /> {game.players.toLocaleString("es-AR")} en línea</span></div>
              <mark>{game.provider}</mark>
            </div>
            <div className="chart"><div><span>Tendencia de 6 días</span><b style={{ color: game.color }}>↗ {game.trend.at(-1)}%</b></div><Chart g={game} /></div>
            <div className="prizes">{game.prizes.map((value, index) => <span key={`${game.id}-${index}`}><small>{["Alta", "Media", "Baja"][index]}</small><b className="liveIndex">{value}</b></span>)}</div>
            <div className="confidence"><div className="confidenceLabel"><span>Confianza del modelo</span><small>Actualización en vivo</small></div><div className="bar scoreBar"><i style={{ width: `${game.score}%`, background: game.color }} /><strong key={game.score} className="liveNumber">{game.score.toFixed(2)}%</strong></div></div>
            <div className="foot"><span>Muestra: {game.rounds.toLocaleString("es-AR")} rondas</span><button onClick={() => visit(game)}>Ver pronóstico <b>→</b></button></div>
          </article>)}
        </div>

        {pageCount > 1 && <div className="mobilePager" aria-label="Cambiar tarjeta">
          <button type="button" aria-label="Tarjeta anterior" onContextMenu={(event) => event.preventDefault()} onPointerDown={(event) => { event.preventDefault(); startHoldPaging(-1); }} onPointerUp={stopHoldPaging} onPointerLeave={stopHoldPaging} onPointerCancel={stopHoldPaging}>‹</button>
          <span><b>{safePage + 1}</b><small>/ {pageCount}</small></span>
          <button type="button" aria-label="Siguiente tarjeta" onContextMenu={(event) => event.preventDefault()} onPointerDown={(event) => { event.preventDefault(); startHoldPaging(1); }} onPointerUp={stopHoldPaging} onPointerLeave={stopHoldPaging} onPointerCancel={stopHoldPaging}>›</button>
        </div>}

        {pageCount > 1 && <div className="pagination" aria-label="Paginación"><span className="pageCounter">{safePage + 1} / {pageCount}</span>{dotPages.map((item) => <button key={item} className={safePage === item ? "active" : ""} onClick={() => setPage(item)} aria-label={`Ir a la página ${item + 1}`} aria-current={safePage === item ? "page" : undefined}><span /></button>)}</div>}
        {!shown.length && <div className="empty">No encontramos juegos. Probá con otra búsqueda.</div>}
      </section>

      <section className="method" id="method">{[["01", "Relevamos tendencias", "Reunimos muestras recientes y cambios de actividad."], ["02", "Analizamos señales", "Detectamos variaciones, continuidad y señales atípicas."], ["03", "Mostramos el resultado", "Presentamos el análisis con una confianza fácil de leer."]].map((item) => <div key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></div>)}</section>
      <footer id="notice"><div className="brand footerLogo"><img src="/winking-logo.png" alt="Winking.Game" /></div><p>Contenido informativo y recreativo. No garantiza resultados ni ganancias. Jugá con responsabilidad.</p><span>© 2026 Winking.Game</span></footer>
    </main>
  );
}
