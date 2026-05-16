-- Reaction counts per block (emoji button clicks)
CREATE TABLE IF NOT EXISTS page_reactions (
  block_id     TEXT    NOT NULL,
  emoji_index  INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (block_id, emoji_index)
);
