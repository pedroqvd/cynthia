-- ================================================================
-- Migration 003: Prontuário completo do paciente
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- PATIENT RECORDS — ficha clínica (1 por paciente)
-- ────────────────────────────────────────────────────────────────
create table if not exists patient_records (
  id                      uuid primary key default gen_random_uuid(),
  lead_id                 uuid not null references leads(id) on delete cascade,
  queixa_principal        text,
  alergias                text,
  medicamentos            text,
  doencas_sistemicas      text,
  historico_odontologico  text,
  plano_tratamento        text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique(lead_id)
);

create trigger patient_records_updated_at
  before update on patient_records
  for each row execute function update_updated_at();

alter table patient_records enable row level security;

create policy "PatientRecords: acesso total para autenticados"
  on patient_records for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ────────────────────────────────────────────────────────────────
-- CLINICAL NOTES — evolução clínica por visita
-- ────────────────────────────────────────────────────────────────
create table if not exists clinical_notes (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references leads(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  titulo         text not null,
  conteudo       text not null,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now()
);

create index if not exists idx_clinical_notes_lead_id    on clinical_notes(lead_id);
create index if not exists idx_clinical_notes_created_at on clinical_notes(created_at desc);

alter table clinical_notes enable row level security;

create policy "ClinicalNotes: acesso total para autenticados"
  on clinical_notes for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ────────────────────────────────────────────────────────────────
-- PATIENT IMAGES — imagens nomeadas do paciente
-- ────────────────────────────────────────────────────────────────
create table if not exists patient_images (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  nome       text not null,
  url        text not null,
  path       text not null,
  tipo       text not null default 'outro'
               check (tipo in ('radiografia', 'foto_intraoral', 'foto_extraoral', 'documento', 'outro')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_images_lead_id on patient_images(lead_id);

alter table patient_images enable row level security;

create policy "PatientImages: acesso total para autenticados"
  on patient_images for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ────────────────────────────────────────────────────────────────
-- PATIENT TASKS — tarefas e lembretes por paciente
-- ────────────────────────────────────────────────────────────────
create table if not exists patient_tasks (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  titulo     text not null,
  descricao  text,
  status     text not null default 'pendente' check (status in ('pendente', 'concluida')),
  vencimento timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patient_tasks_lead_id on patient_tasks(lead_id);
create index if not exists idx_patient_tasks_status  on patient_tasks(status);

create trigger patient_tasks_updated_at
  before update on patient_tasks
  for each row execute function update_updated_at();

alter table patient_tasks enable row level security;

create policy "PatientTasks: acesso total para autenticados"
  on patient_tasks for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
