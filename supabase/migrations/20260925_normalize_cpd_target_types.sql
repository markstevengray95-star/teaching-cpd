create or replace function private.normalize_cpd_assignment_target()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.target_id like 'custom:%' then
    new.target_type := 'custom';
  elsif new.target_id = any(array['ect-new-teacher','excellent-teaching','send-champion','aspiring-middle-leader','pastoral-development','digital-ai','literacy-language']) then
    new.target_type := 'pathway';
  else
    new.target_type := 'catalogue';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_normalize_cpd_assignment_target on public.cpd_assignments;
create trigger trg_normalize_cpd_assignment_target
before insert or update of target_id, target_type on public.cpd_assignments
for each row execute function private.normalize_cpd_assignment_target();

create or replace function private.normalize_training_requirement_target()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.target_type := case when new.target_id like 'custom:%' then 'custom' else 'catalogue' end;
  return new;
end;
$$;

drop trigger if exists trg_normalize_training_requirement_target on public.training_requirements;
create trigger trg_normalize_training_requirement_target
before insert or update of target_id, target_type on public.training_requirements
for each row execute function private.normalize_training_requirement_target();
