begin;

create table public.turmas (
    id uuid primary key default gen_random_uuid (),
    nome text not null check (length(btrim (nome)) > 0),
    criado_em timestamptz not null default now()
);

create table public.turma_catequistas (
    usuario_id uuid not null references auth.users (id) on delete cascade,
    turma_id uuid not null references public.turmas (id) on delete cascade,
    primary key (usuario_id, turma_id)
);

alter table public.turmas enable row level security;

alter table public.turma_catequistas enable row level security;

revoke all on
table public.turmas,
public.turma_catequistas
from public, anon, authenticated;

grant
select on
table public.turmas, public.turma_catequistas to authenticated;

create policy "Catequistas leem os proprios vinculos" on public.turma_catequistas for
select to authenticated using (
        usuario_id = (
            select auth.uid ()
        )
    );

create policy "Catequistas leem turmas vinculadas" on public.turmas for
select to authenticated using (
        exists (
            select 1
            from public.turma_catequistas as vinculo
            where
                vinculo.turma_id = turmas.id
                and vinculo.usuario_id = (
                    select auth.uid ()
                )
        )
    );

commit;