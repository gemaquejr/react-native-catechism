begin;

create function public.criar_perfil_acesso_pendente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis_acesso (usuario_id, papel, status)
  values (new.id, 'catequista', 'pendente');

  return new;
end;
$$;

revoke all on function public.criar_perfil_acesso_pendente()
  from public, anon, authenticated;

create trigger criar_perfil_acesso_apos_cadastro
after insert on auth.users
for each row
execute function public.criar_perfil_acesso_pendente();

commit;