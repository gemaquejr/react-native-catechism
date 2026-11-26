begin;

alter table public.turmas
  add column dono_id uuid references auth.users(id) on delete set null;

create index turmas_dono_id_idx on public.turmas (dono_id);

drop policy "Catequistas leem os proprios vinculos"
  on public.turma_catequistas;

create policy "Contas aprovadas consultam vinculos autorizados"
  on public.turma_catequistas
  for select to authenticated
  using (
    exists (
      select 1
      from public.perfis_acesso as perfil
      where perfil.usuario_id = (select auth.uid())
        and perfil.status = 'aprovado'
        and (
          perfil.papel = 'administrador'
          or turma_catequistas.usuario_id = perfil.usuario_id
        )
    )
  );

drop policy "Catequistas leem turmas vinculadas" on public.turmas;

create policy "Contas aprovadas consultam turmas autorizadas"
  on public.turmas
  for select to authenticated
  using (
    exists (
      select 1
      from public.perfis_acesso as perfil
      where perfil.usuario_id = (select auth.uid())
        and perfil.status = 'aprovado'
        and (
          perfil.papel = 'administrador'
          or turmas.dono_id = perfil.usuario_id
          or exists (
            select 1
            from public.turma_catequistas as vinculo
            where vinculo.turma_id = turmas.id
              and vinculo.usuario_id = perfil.usuario_id
          )
        )
    )
  );

-- A leitura das matrículas também precisa reconhecer o dono e o administrador.
drop policy "Catequistas leem matriculas das suas turmas"
  on public.matriculas;

create policy "Contas aprovadas consultam matriculas das turmas autorizadas"
  on public.matriculas
  for select to authenticated
  using (
    exists (
      select 1
      from public.turmas as turma
      where turma.id = matriculas.turma_id
    )
  );

commit;