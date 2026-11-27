begin;

create function public.cadastrar_aluno_na_turma(
  p_turma_id uuid,
  p_nome text,
  p_pai text default '',
  p_mae text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_aluno_id uuid;
begin
  if not exists (
    select 1
    from public.perfis_acesso as perfil
    join public.turmas as turma on turma.id = p_turma_id
    where perfil.usuario_id = v_usuario_id
      and perfil.status = 'aprovado'
      and (
        perfil.papel = 'administrador'
        or turma.dono_id = v_usuario_id
      )
  ) then
    raise exception 'Você não tem permissão para cadastrar alunos nesta turma.'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_nome), '') is null then
    raise exception 'Informe o nome do aluno.'
      using errcode = '22023';
  end if;

  insert into public.alunos (nome, pai, mae)
  values (
    btrim(p_nome),
    coalesce(btrim(p_pai), ''),
    coalesce(btrim(p_mae), '')
  )
  returning id into v_aluno_id;

  insert into public.matriculas (turma_id, aluno_id)
  values (p_turma_id, v_aluno_id);

  return v_aluno_id;
end;
$$;

revoke all on function public.cadastrar_aluno_na_turma(uuid, text, text, text)
  from public, anon, authenticated;

grant execute on function public.cadastrar_aluno_na_turma(uuid, text, text, text)
  to authenticated;

commit;