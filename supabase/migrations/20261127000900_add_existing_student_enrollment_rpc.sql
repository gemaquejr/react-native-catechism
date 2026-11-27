begin;

create function public.matricular_aluno_existente(
  p_turma_id uuid,
  p_aluno_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
begin
  if not exists (
    select 1
    from public.perfis_acesso as perfil
    join public.turmas as destino on destino.id = p_turma_id
    where perfil.usuario_id = v_usuario_id
      and perfil.status = 'aprovado'
      and exists (
        select 1
        from public.alunos as aluno
        where aluno.id = p_aluno_id
      )
      and (
        perfil.papel = 'administrador'
        or (
          destino.dono_id = v_usuario_id
          and exists (
            select 1
            from public.matriculas as matricula
            join public.turmas as origem on origem.id = matricula.turma_id
            where matricula.aluno_id = p_aluno_id
              and origem.dono_id = v_usuario_id
          )
        )
      )
  ) then
    raise exception 'Você não tem permissão para realizar esta matrícula.'
      using errcode = '42501';
  end if;

  insert into public.matriculas (turma_id, aluno_id)
  values (p_turma_id, p_aluno_id)
  on conflict (turma_id, aluno_id) do nothing;

  return found;
end;
$$;

revoke all on function public.matricular_aluno_existente(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.matricular_aluno_existente(uuid, uuid)
  to authenticated;

commit;