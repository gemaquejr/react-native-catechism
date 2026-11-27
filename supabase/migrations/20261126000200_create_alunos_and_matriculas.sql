begin;

create table public.alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) > 0),
  pai text not null default '',
  mae text not null default '',
  criado_em timestamptz not null default now()
);

create table public.matriculas (
  turma_id uuid not null references public.turmas(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (turma_id, aluno_id)
);

create index matriculas_aluno_id_idx
  on public.matriculas (aluno_id);

alter table public.alunos enable row level security;
alter table public.matriculas enable row level security;

revoke all on table public.alunos, public.matriculas
  from public, anon, authenticated;

grant select on table public.alunos, public.matriculas
  to authenticated;

create policy "Catequistas leem matriculas das suas turmas"
  on public.matriculas
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.turma_catequistas as vinculo
      where vinculo.turma_id = matriculas.turma_id
        and vinculo.usuario_id = (select auth.uid())
    )
  );

create policy "Catequistas leem alunos das suas turmas"
  on public.alunos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.matriculas as matricula
      where matricula.aluno_id = alunos.id
    )
  );

commit;