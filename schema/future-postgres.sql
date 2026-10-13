-- PROPOSED ONLY — educational schema sketch, NOT a production migration.
-- Requires external review for tenant isolation, RLS, audit, retention, consent and indexes.
-- Do not execute this against a real school system without a controlled migration plan.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  external_subject text NOT NULL,
  role_code text NOT NULL CHECK (role_code IN ('educator','curriculum_lead','administrator','reviewer')),
  active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, external_subject)
);
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  internal_reference text NOT NULL,
  display_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, internal_reference)
);
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  staff_id uuid NOT NULL REFERENCES staff_users(id),
  student_id uuid NOT NULL REFERENCES students(id),
  assigned_from timestamptz NOT NULL,
  assigned_until timestamptz,
  CHECK (assigned_until IS NULL OR assigned_until > assigned_from)
);
CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  student_id uuid NOT NULL REFERENCES students(id),
  recorded_by uuid NOT NULL REFERENCES staff_users(id),
  observed_at timestamptz NOT NULL,
  learning_domain text NOT NULL,
  observation_text text NOT NULL,
  evidence_status text NOT NULL DEFAULT 'draft' CHECK (evidence_status IN ('draft','approved','withdrawn')),
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  student_id uuid NOT NULL REFERENCES students(id),
  status text NOT NULL CHECK (status IN ('draft','reviewed','approved','released')),
  data jsonb NOT NULL,
  evidence_ids jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  reviewed_by uuid REFERENCES staff_users(id),
  template_version text NOT NULL,
  model_identifier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_id uuid REFERENCES staff_users(id),
  student_id uuid REFERENCES students(id),
  action text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id text,
  decision_code text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_observations_scoped ON observations (tenant_id, student_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_scoped ON teacher_assignments (tenant_id, staff_id, student_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_drafts_scoped ON portfolio_drafts (tenant_id, student_id, created_at DESC);

-- This schema deliberately DOES NOT declare "secure by default" RLS policies.
-- Before real deployment: introduce audited RLS, enforce same-tenant FK relationships,
-- use a dedicated non-bypass application role, verify transaction-scoped user identity,
-- add consent/retention/version tables, prevent tenant ID spoofing and test cross-tenant leaks.
