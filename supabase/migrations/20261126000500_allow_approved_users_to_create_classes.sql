begin;

alter table public.turmas
  alter column dono_id set default auth.uid();

grant insert (nome) on public.turmas to authenticated;

create policy "Contas aprovadas criam turmas proprias"
  on public.turmas
  for insert
  to authenticated
  with check (
    dono_id = (select auth.uid())
    and exists (
      select 1
      from public.perfis_acesso as perfil
      where perfil.usuario_id = (select auth.uid())
        and perfil.status = 'aprovado'
    )
  );

commit;