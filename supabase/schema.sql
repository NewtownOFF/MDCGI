-- ============================================================
-- Médecin GI — schéma Supabase
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Rôles possibles, du plus faible au plus fort
create type public.user_role as enum (
  'inconnu',
  'medecin',
  'medecin_distingue',
  'co_gerant',
  'gerant'
);

-- ------------------------------------------------------------
-- Profils (1 ligne par utilisateur Discord authentifié)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique not null,
  username text not null,
  avatar_url text,
  role public.user_role not null default 'inconnu',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Tout utilisateur authentifié peut voir tous les profils (nécessaire pour afficher
-- les auteurs des Flex, la liste des rôles, etc.)
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Personne ne peut modifier son propre rôle directement (uniquement via la fonction
-- admin_set_role ci-dessous, qui vérifie les permissions côté serveur).
create policy "profiles_update_self_non_role_fields"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- Trigger : création automatique du profil à l'inscription
-- Le tout premier utilisateur devient 'gerant'. Tous les suivants : 'inconnu'.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
  assigned_role public.user_role;
begin
  select not exists (select 1 from public.profiles) into is_first;
  assigned_role := case when is_first then 'gerant' else 'inconnu' end;

  insert into public.profiles (id, discord_id, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'provider_id', new.raw_user_meta_data ->> 'sub'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Inconnu'),
    new.raw_user_meta_data ->> 'avatar_url',
    assigned_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Fonction sécurisée de changement de rôle
-- - gerant : peut assigner n'importe quel rôle SAUF 'gerant' (rôle unique, immuable)
-- - gerant uniquement : peut assigner/retirer 'co_gerant'
-- - co_gerant : peut assigner 'medecin' / 'medecin_distingue' / 'inconnu' uniquement
-- ------------------------------------------------------------
create or replace function public.admin_set_role(p_user_id uuid, p_new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role public.user_role;
begin
  select role into caller_role from public.profiles where id = auth.uid();

  if caller_role is null or caller_role not in ('gerant', 'co_gerant') then
    raise exception 'Permission refusée : rôle administrateur requis';
  end if;

  if p_new_role = 'gerant' then
    raise exception 'Le rôle Gérant est unique et ne peut pas être réassigné ici';
  end if;

  if p_new_role = 'co_gerant' and caller_role <> 'gerant' then
    raise exception 'Seul le Gérant peut nommer un Co-Gérant';
  end if;

  update public.profiles set role = p_new_role where id = p_user_id;
end;
$$;

-- ------------------------------------------------------------
-- Liens utiles
-- ------------------------------------------------------------
create table public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

alter table public.links enable row level security;

create policy "links_select_authenticated"
  on public.links for select
  to authenticated
  using (true);

create policy "links_write_admins"
  on public.links for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('gerant', 'co_gerant')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('gerant', 'co_gerant')
  ));

-- ------------------------------------------------------------
-- Publications Flex (photos de réanimations / soins)
-- ------------------------------------------------------------
create type public.flex_status as enum ('pending', 'approved', 'rejected');

create table public.flex_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  image_path text not null, -- chemin dans le bucket Supabase Storage
  reanimations integer not null default 0,
  soins integer not null default 0,
  status public.flex_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.flex_posts enable row level security;

-- Tout authentifié peut voir les posts approuvés
create policy "flex_select_approved"
  on public.flex_posts for select
  to authenticated
  using (status = 'approved');

-- L'auteur voit ses propres posts quel que soit le statut
create policy "flex_select_own"
  on public.flex_posts for select
  to authenticated
  using (user_id = auth.uid());

-- Les admins voient tout (file de validation)
create policy "flex_select_admins"
  on public.flex_posts for select
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('gerant', 'co_gerant')
  ));

-- Seuls Médecin et au-dessus peuvent poster
create policy "flex_insert_medecin_plus"
  on public.flex_posts for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('medecin', 'medecin_distingue', 'co_gerant', 'gerant')
    )
  );

-- Seuls les admins peuvent changer le statut (validation/rejet)
create policy "flex_update_admins"
  on public.flex_posts for update
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('gerant', 'co_gerant')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('gerant', 'co_gerant')
  ));

-- ------------------------------------------------------------
-- Storage : bucket pour les photos de Flex
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('flex-photos', 'flex-photos', true)
on conflict (id) do nothing;

create policy "flex_photos_upload_medecin_plus"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'flex-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('medecin', 'medecin_distingue', 'co_gerant', 'gerant')
    )
  );

create policy "flex_photos_read_all"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'flex-photos');
