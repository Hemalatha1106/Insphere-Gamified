-- Mark all existing messages as read to fix the "unread count" issue for legacy messages
UPDATE public.messages
SET is_read = TRUE
WHERE is_read = FALSE;
