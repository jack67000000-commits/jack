-- Add independent content scopes for winking.games and elcuk.lol.
alter table public.winking_games
  add column site_key text not null default 'winking';

alter table public.winking_games drop constraint winking_games_pkey;
alter table public.winking_games drop constraint winking_games_slug_key;

alter table public.winking_games
  add constraint winking_games_site_key_check
  check (site_key in ('winking', 'elcuk'));

alter table public.winking_games
  add constraint winking_games_pkey primary key (site_key, id);

alter table public.winking_games
  add constraint winking_games_site_slug_key unique (site_key, slug);

create index winking_games_site_catalog_idx
  on public.winking_games (site_key, enabled, sort_order, id);

insert into public.winking_settings (key, value)
select 'redirects:winking', value
from public.winking_settings
where key = 'redirects'
on conflict (key) do nothing;

insert into public.winking_settings (key, value)
values (
  'redirects:elcuk',
  '{"default_url":"https://elcuk.lol/","open_in_new_tab":false}'::jsonb
)
on conflict (key) do nothing;
