CREATE TABLE IF NOT EXISTS personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  vendor TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE personal_expenses
  ALTER COLUMN date SET DEFAULT CURRENT_DATE;

ALTER TABLE personal_expenses
  ALTER COLUMN description DROP NOT NULL;

ALTER TABLE personal_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own personal_expenses" ON personal_expenses;

CREATE POLICY "Users can manage own personal_expenses" ON personal_expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
