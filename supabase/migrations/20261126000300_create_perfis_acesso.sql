begin;

create table public.perfis_acesso (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  papel text not null default 'catequista'
    check (papel in ('administrador', 'catequista')),
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'revogado')),
  criado_em timestamptz not null default now()
);

alter table public.perfis_acesso enable row level security;

revoke all on table public.perfis_acesso
  from public, anon, authenticated;

grant select on table public.perfis_acesso to authenticated;

create policy "Usuarios consultam o proprio perfil de acesso"
  on public.perfis_acesso
  for select
  to authenticated
  using (usuario_id = (select auth.uid()));

commit;