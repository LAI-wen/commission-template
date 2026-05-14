-- ── Creator Profile ──────────────────────────────────────────────────────────
-- Replace with your own info in Dashboard → Manage
INSERT OR IGNORE INTO creators (
  id, display_name, bio, styles,
  is_open, open_note, queue_limit
) VALUES (
  'main',
  'Your Name',
  '歡迎來到我的委託頁面！',
  '["插圖"]',
  0,
  '目前暫停接案，敬請期待。',
  8
);

-- ── Default Commission Types ───────────────────────────────────────────────────
-- You can edit or delete these in Dashboard → Settings
INSERT OR IGNORE INTO commission_types (id, name, description, base_price, sort_order, is_active) VALUES
  ('halfbody',  '半身插圖', '腰部以上，含簡單背景。', 1200, 0, 1),
  ('fullbody',  '全身插圖', '全身，含背景。',         1800, 1, 1);
