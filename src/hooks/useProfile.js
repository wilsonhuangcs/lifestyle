import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useProfile(userId) {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', birthday: '', bio: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, birthday, bio, avatar_url')
        .eq('user_id', userId)
        .single();

      if (data) {
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          birthday: data.birthday || '',
          bio: data.bio || '',
          avatarUrl: data.avatar_url || '',
        });
      } else {
        await supabase.from('profiles').insert({ user_id: userId });
      }
      setLoading(false);
    };

    load();
  }, [userId]);

  const updateProfile = useCallback(async (fields) => {
    setProfile(prev => ({ ...prev, ...fields }));
    const dbFields = {};
    if (fields.firstName !== undefined) dbFields.first_name = fields.firstName;
    if (fields.lastName !== undefined) dbFields.last_name = fields.lastName;
    if (fields.birthday !== undefined) dbFields.birthday = fields.birthday;
    if (fields.bio !== undefined) dbFields.bio = fields.bio;
    if (fields.avatarUrl !== undefined) dbFields.avatar_url = fields.avatarUrl;
    await supabase.from('profiles').update(dbFields).eq('user_id', userId);
  }, [userId]);

  return { profile, updateProfile, loading };
}
