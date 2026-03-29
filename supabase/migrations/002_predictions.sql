-- Heartify: predictions table
-- Run this in the Supabase SQL editor (after 001_profiles.sql)

CREATE TABLE IF NOT EXISTS predictions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  input_data       jsonb NOT NULL,
  risk_probability float NOT NULL,
  risk_level       text NOT NULL,
  predicted_class  integer NOT NULL,
  shap_values      jsonb,
  top_factors      jsonb,
  nlp_report       text,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS predictions_user_id_idx ON predictions (user_id);
CREATE INDEX IF NOT EXISTS predictions_created_at_idx ON predictions (created_at DESC);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own predictions
CREATE POLICY "predictions_select_own" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "predictions_insert_own" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "predictions_update_own" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "predictions_delete_own" ON predictions
  FOR DELETE USING (auth.uid() = user_id);
