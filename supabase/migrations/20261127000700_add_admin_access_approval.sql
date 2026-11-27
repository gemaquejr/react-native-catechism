begin;

create function public.listar_solicitacoes_pendentes()
returns table (
  usuario_id uuid,
  email text,
  solicitado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.perfis_acesso as p
    where p.usuario_id = auth.uid()
      and p.papel = 'administrador'
      and p.status = 'aprovado'
  ) then
    raise exception 'Apenas administradores aprovados podem listar solicitações.'
      using errcode = '42501';
  end if;

  return query
    select p.usuario_id, u.email::text, p.criado_em
    from public.perfis_acesso as p
    join auth.users as u on u.id = p.usuario_id
    where p.papel = 'catequista'
      and p.status = 'pendente'
      and u.email is not null
      and u.email_confirmed_at is not null
    order by p.criado_em, p.usuario_id;
end;
$$;

create function public.aprovar_catequista(p_usuario_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.perfis_acesso as p
    where p.usuario_id = auth.uid()
      and p.papel = 'administrador'
      and p.status = 'aprovado'
  ) then
    raise exception 'Apenas administradores aprovados podem aprovar solicitações.'
      using errcode = '42501';
  end if;

  update public.perfis_acesso as p
  set status = 'aprovado'
  where p.usuario_id = p_usuario_id
    and p.papel = 'catequista'
    and p.status = 'pendente'
    and exists (
      select 1
      from auth.users as u
      where u.id = p.usuario_id
        and u.email is not null
        and u.email_confirmed_at is not null
    );

  return found;
end;
$$;

revoke all on function public.listar_solicitacoes_pendentes()
  from public, anon, authenticated;
revoke all on function public.aprovar_catequista(uuid)
  from public, anon, authenticated;

grant execute on function public.listar_solicitacoes_pendentes()
  to authenticated;
grant execute on function public.aprovar_catequista(uuid)
  to authenticated;

commit;