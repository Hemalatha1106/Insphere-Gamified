-- Fix RLS policies for community member removal

-- Policy: Allow community admins (creators) to remove members
CREATE POLICY "members_delete_admin" ON public.community_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = community_members.community_id 
    AND created_by = auth.uid()
  )
);

-- Policy: Allow members to leave (delete their own membership)
CREATE POLICY "members_delete_self" ON public.community_members FOR DELETE USING (
  auth.uid() = user_id
);
