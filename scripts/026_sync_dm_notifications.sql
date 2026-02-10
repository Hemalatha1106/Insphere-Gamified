
-- Trigger to mark notification as read when messages are read
CREATE OR REPLACE FUNCTION public.sync_message_read_to_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_read changed to TRUE
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        -- Find pending notifications for this message (or from this sender)
        -- Since we implemented DMs as "one notification per message", we can link them?
        -- Actually, the notification link might be generic "/messages".
        -- But strict linking is hard without a reference ID.
        -- However, if I read a message from User X, I probably read ALL notifications from User X?
        
        -- Let's mark all notifications from this sender as read for the recipient
        UPDATE public.notifications
        SET is_read = TRUE
        WHERE user_id = NEW.recipient_id
          AND type = 'message'
          AND metadata->>'sender_id' = NEW.sender_id::text
          AND is_read = FALSE;
          
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_dm_read_notification ON public.messages;
CREATE TRIGGER sync_dm_read_notification
    AFTER UPDATE OF is_read ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.sync_message_read_to_notification();
