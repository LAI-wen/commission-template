-- ── Creator Profile ──────────────────────────────────────────────────────────
INSERT OR REPLACE INTO creators (
  id, display_name, bio, avatar_url, styles,
  contact_email, contact_discord,
  is_open, open_note, queue_limit
) VALUES (
  'main',
  'Wen',
  '嗨！我是 Wen，一名插畫師，喜歡畫柔和色調的人物插圖與塗鴉。接受商業/個人委託，歡迎來信洽詢！',
  '/images/大頭一.jpg',
  '["插圖","塗鴉","Q版","表情包"]',
  'bradlea028@gmail.com',
  'wen#0001',
  1,
  '目前開放接案，每月名額有限，先到先得！',
  8
);

-- ── Commission Types ──────────────────────────────────────────────────────────
INSERT OR REPLACE INTO commission_types (id, name, description, base_price, sort_order, is_active) VALUES
  ('bust',      '胸像插圖',     '胸部以上，精緻上色，含簡單背景。',         800,  0, 1),
  ('halfbody',  '半身插圖',     '腰部以上，精緻上色，含簡單背景。',        1200,  1, 1),
  ('fullbody',  '全身插圖',     '全身，精緻上色，含背景。',               1800,  2, 1),
  ('fullpage',  '滿版插圖',     '全版面構圖，複雜背景，適合作品集封面。',   3000,  3, 1),
  ('chibi',     'Q版/小人',     '可愛 Q 版風格，全身，簡單背景。',         600,  4, 1),
  ('doodle',    '塗鴉/速寫',   '輕鬆線稿塗鴉風，全身或半身均可。',        400,  5, 1),
  ('emote',     '表情包套組',   'Twitch/Discord 用表情包，每組 5 款。',    1500,  6, 1);

-- ── Price Options ─────────────────────────────────────────────────────────────
-- Background complexity (applicable to most types)
INSERT OR REPLACE INTO price_options (id, type_id, label, option_type, price_delta, sort_order) VALUES
  ('bust_bg_simple',     'bust',     '簡單純色背景', 'add',      0, 0),
  ('bust_bg_complex',    'bust',     '複雜場景背景', 'add',    400, 1),
  ('half_bg_simple',     'halfbody', '簡單純色背景', 'add',      0, 0),
  ('half_bg_complex',    'halfbody', '複雜場景背景', 'add',    500, 1),
  ('full_bg_simple',     'fullbody', '簡單純色背景', 'add',      0, 0),
  ('full_bg_complex',    'fullbody', '複雜場景背景', 'add',    600, 1),
  ('chibi_extra',        'chibi',    '加一個角色',   'add',    400, 0),
  ('doodle_color',       'doodle',   '加上色',       'add',    200, 0),
  ('emote_extra5',       'emote',    '加購 5 款',    'add',   1200, 0),
  ('commercial',         'bust',     '商業授權',     'add',    800, 2),
  ('commercial_half',    'halfbody', '商業授權',     'add',    800, 2),
  ('commercial_full',    'fullbody', '商業授權',     'add',    800, 2);

-- ── Work Folders ──────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO work_folders (id, name, sort_order) VALUES
  ('folder_illust',  '插圖',   0),
  ('folder_fullpage','滿版',   1),
  ('folder_bust',    '大頭像', 2),
  ('folder_doodle',  '塗鴉',   3),
  ('folder_chibi',   'Q版',    4);

-- ── Works ─────────────────────────────────────────────────────────────────────
-- 插圖
INSERT OR REPLACE INTO works (id, title, preview_url, folder_id, tags, sort_order, is_visible) VALUES
  ('w01', '插圖 01', '/images/插圖一.jpg',   'folder_illust', '["插圖","人物"]', 0, 1),
  ('w02', '插圖 02', '/images/插圖二.jpg',   'folder_illust', '["插圖","人物"]', 1, 1),
  ('w03', '插圖 03', '/images/插圖三.jpg',   'folder_illust', '["插圖","人物"]', 2, 1),
  ('w04', '插圖 04', '/images/插圖四.png',   'folder_illust', '["插圖","人物"]', 3, 1),
  ('w05', '插圖 05', '/images/插圖五.jpg',   'folder_illust', '["插圖","人物"]', 4, 1),
  ('w06', '插圖 06', '/images/插圖六.jpg',   'folder_illust', '["插圖","人物"]', 5, 1),
  ('w07', '插圖 07', '/images/插圖七.jpg',   'folder_illust', '["插圖","人物"]', 6, 1),
  ('w08', '插圖 08', '/images/插圖八.jpg',   'folder_illust', '["插圖","人物"]', 7, 1),
  ('w09', '插圖 09', '/images/插圖九.jpg',   'folder_illust', '["插圖","人物"]', 8, 1),
  ('w10', '插圖 10', '/images/插圖十.jpg',   'folder_illust', '["插圖","人物"]', 9, 1);

-- 滿版
INSERT OR REPLACE INTO works (id, title, preview_url, folder_id, tags, sort_order, is_visible) VALUES
  ('wf01', '滿版 01',    '/images/滿版一.jpg',     'folder_fullpage', '["滿版","插圖"]', 0, 1),
  ('wf02', '滿版塗鴉 01','/images/滿版塗鴉一.jpg', 'folder_fullpage', '["滿版","塗鴉"]', 1, 1),
  ('wf03', '滿版塗鴉 02','/images/滿版塗鴉二.jpg', 'folder_fullpage', '["滿版","塗鴉"]', 2, 1);

-- 大頭像
INSERT OR REPLACE INTO works (id, title, preview_url, folder_id, tags, sort_order, is_visible) VALUES
  ('wb01', '大頭 01', '/images/大頭一.jpg', 'folder_bust', '["大頭","人物"]', 0, 1),
  ('wb02', '大頭 02', '/images/大頭二.jpg', 'folder_bust', '["大頭","人物"]', 1, 1),
  ('wb03', '大頭 03', '/images/大頭三.jpg', 'folder_bust', '["大頭","人物"]', 2, 1);

-- 塗鴉
INSERT OR REPLACE INTO works (id, title, preview_url, folder_id, tags, sort_order, is_visible) VALUES
  ('wd01', '塗鴉大頭 01',    '/images/塗鴉大頭一.png',      'folder_doodle', '["塗鴉","大頭"]', 0, 1),
  ('wd02', '塗鴉大頭 02',    '/images/塗鴉大頭二.png',      'folder_doodle', '["塗鴉","大頭"]', 1, 1),
  ('wd03', '塗鴉大頭 03',    '/images/塗鴉大頭三.jpg',      'folder_doodle', '["塗鴉","大頭"]', 2, 1),
  ('wd04', '塗鴉半身',       '/images/塗鴉半身一.png',      'folder_doodle', '["塗鴉","半身"]', 3, 1),
  ('wd05', '立繪與表情包',   '/images/塗鴉立繪與表情包.jpg','folder_doodle', '["塗鴉","表情包"]',4, 1);

-- Q版
INSERT OR REPLACE INTO works (id, title, preview_url, folder_id, tags, sort_order, is_visible) VALUES
  ('wc01', 'Q版立繪 01',  '/images/小人塗鴉立繪01.jpg',     'folder_chibi', '["Q版","塗鴉"]', 0, 1),
  ('wc02', 'Q版立繪 02',  '/images/小人塗鴉立繪02.jpg',     'folder_chibi', '["Q版","塗鴉"]', 1, 1),
  ('wc03', 'Q版立繪 03',  '/images/小人塗鴉立繪03.jpg',     'folder_chibi', '["Q版","塗鴉"]', 2, 1),
  ('wc04', 'Q版立繪 04',  '/images/小人塗鴉立繪04.jpg',     'folder_chibi', '["Q版","塗鴉"]', 3, 1),
  ('wc05', 'Q版立繪總覽', '/images/小人塗鴉立繪總覽01.jpg', 'folder_chibi', '["Q版","塗鴉"]', 4, 1);

-- ── Sample Commissions (for dashboard preview) ────────────────────────────────
INSERT OR REPLACE INTO commissions (
  id, type_id, client_name, client_email, detail, estimated_price, status, is_paid, created_at, updated_at
) VALUES
  ('demo-01', 'bust',     '小花',   'xiaohoa@example.com',   '想要一張 OC 的胸像，藍色系配色，表情溫柔。',        800,  'in_progress', 1, unixepoch()-86400*3, unixepoch()-86400),
  ('demo-02', 'chibi',    'Kira',   'kira@example.com',      '兩個 Q 版角色，一隻貓娘一隻狐狸娘，可愛風格。',    1000,  'accepted',    0, unixepoch()-86400*2, unixepoch()-86400*2),
  ('demo-03', 'fullpage', '米米',   'mimi@example.com',      '滿版構圖，想要夕陽下的少女，帶有夢幻感。',         3000,  'revision',    1, unixepoch()-86400*5, unixepoch()-3600),
  ('demo-04', 'doodle',   'Tomás',  'tomas@example.com',     '速寫風格，角色拿著劍的動態姿勢，不需要背景。',      600,  'pending',     0, unixepoch()-3600,    unixepoch()-3600),
  ('demo-05', 'halfbody', 'Alex',   'alex@example.com',      '半身像，OC 是魔法師風格，希望有魔法粒子特效感。',  1200,  'completed',   1, unixepoch()-86400*7, unixepoch()-86400*2),
  ('demo-06', 'emote',    '星河',   'starriver@example.com', 'Discord 用表情包，角色是貓耳少女，要 5 款情緒。',  1500,  'delivered',   1, unixepoch()-86400*10,unixepoch()-86400*1);
