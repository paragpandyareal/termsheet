// PRD section 7. Money is integer cents. Each statement ends with ";" and a newline.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS buyer (
  id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, business_type TEXT,
  stated_founded_year INT, paypal_email TEXT, has_sales_app BOOLEAN DEFAULT false, seeded BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS credit_line (
  id TEXT PRIMARY KEY, buyer_id TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'NONE',
  limit_cents INT NOT NULL DEFAULT 0, ceiling_cents INT NOT NULL DEFAULT 0, term_days INT DEFAULT 30, deposit_pct INT DEFAULT 0,
  vault_id TEXT, paypal_customer_id TEXT, scorecard_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, buyer_id TEXT NOT NULL, order_no TEXT UNIQUE NOT NULL, amount_cents INT NOT NULL,
  ship_to TEXT, items_json JSONB, status TEXT NOT NULL DEFAULT 'CART',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS application (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL, buyer_id TEXT NOT NULL, form_json JSONB, status TEXT NOT NULL DEFAULT 'RUNNING',
  scorecard_json JSONB, decision_json JSONB, setup_token_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY, run_id TEXT NOT NULL, evidence_id TEXT NOT NULL, source TEXT, summary TEXT, payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS analyst_run (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, subject_id TEXT NOT NULL, model TEXT, mode TEXT, prompt_hash TEXT,
  messages_json JSONB, trace_json JSONB DEFAULT '[]', output_json JSONB, status TEXT DEFAULT 'RUNNING',
  token_usage JSONB, started_at TIMESTAMPTZ DEFAULT now(), ended_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS payout (
  id TEXT PRIMARY KEY, order_id TEXT UNIQUE NOT NULL, batch_id TEXT, item_id TEXT, amount_cents INT, fee_cents INT,
  status TEXT, debug_id TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS receivable (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL, buyer_id TEXT NOT NULL, principal_cents INT NOT NULL, due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN', force_decline_once BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS instalment (
  id TEXT PRIMARY KEY, receivable_id TEXT NOT NULL, seq INT NOT NULL, amount_cents INT NOT NULL, due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED', reminded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS charge_attempt (
  id TEXT PRIMARY KEY, instalment_id TEXT NOT NULL, mode TEXT NOT NULL, paypal_order_id TEXT, capture_id TEXT,
  status TEXT, error_name TEXT, debug_id TEXT, raw_json JSONB, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY, buyer_id TEXT NOT NULL, receivable_id TEXT, sender TEXT NOT NULL, body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS restructure (
  id TEXT PRIMARY KEY, receivable_id TEXT NOT NULL, proposal_json JSONB, status TEXT NOT NULL DEFAULT 'PROPOSED',
  policy_check_json JSONB, run_id TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS limit_change (
  id TEXT PRIMARY KEY, credit_line_id TEXT NOT NULL, from_cents INT, to_cents INT, reason_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS webhook_event (
  id TEXT PRIMARY KEY, app TEXT NOT NULL, paypal_event_id TEXT UNIQUE NOT NULL, type TEXT, verified BOOLEAN, raw_body TEXT,
  created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS money_event (
  id TEXT PRIMARY KEY, party TEXT NOT NULL, direction TEXT NOT NULL, amount_cents INT NOT NULL, label TEXT,
  paypal_id TEXT, debug_id TEXT, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS document (
  id TEXT PRIMARY KEY, buyer_id TEXT NOT NULL, kind TEXT, text TEXT, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS clock (
  id INT PRIMARY KEY DEFAULT 1, offset_days INT NOT NULL DEFAULT 0);

INSERT INTO clock (id, offset_days) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
`;
