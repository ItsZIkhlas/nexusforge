-- Split html_content into three separate columns for HTML, CSS, and JS.
-- Existing rows keep their html_content as-is (the editor auto-splits them on first load).
ALTER TABLE websites ADD COLUMN IF NOT EXISTS css_content TEXT;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS js_content  TEXT;
