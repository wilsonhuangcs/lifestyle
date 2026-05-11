import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { mapRow, buildDbFields } from '../shared/utils';
import { calendarEventRowMap, calendarEventFieldMap } from '../data/calendarFieldMaps';

export function useCalendarEvents(userId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('starts_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('[useCalendarEvents] load failed:', error.message);
        setEvents([]);
      } else {
        setEvents((data || []).map(r => mapRow(r, calendarEventRowMap)));
      }
      setLoading(false);
    };
    load();

    // Realtime subscription: get live INSERT/UPDATE/DELETE notifications
    // so Discord-ingested events appear (and the badge updates) without a refresh.
    const channel = supabase
      .channel(`calendar_events:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calendar_events',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = mapRow(payload.new, calendarEventRowMap);
          setEvents(prev => {
            if (prev.some(e => e.id === row.id)) return prev;
            return [...prev, row].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
          });
        } else if (payload.eventType === 'UPDATE') {
          const row = mapRow(payload.new, calendarEventRowMap);
          setEvents(prev => prev
            .map(e => e.id === row.id ? row : e)
            .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
          );
        } else if (payload.eventType === 'DELETE') {
          setEvents(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addEvent = useCallback(async (fields) => {
    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const newEvent = {
      id,
      userId,
      source: 'manual',
      isRead: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...fields,
    };
    setEvents(prev => [...prev, newEvent].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
    const dbFields = buildDbFields(newEvent, calendarEventFieldMap);
    const { error } = await supabase.from('calendar_events').insert({ ...dbFields, user_id: userId });
    if (error) {
      console.error('[useCalendarEvents] insert failed:', error.message);
      setEvents(prev => prev.filter(e => e.id !== id));
      return null;
    }
    return newEvent;
  }, [userId]);

  const updateEvent = useCallback(async (id, fields) => {
    let original;
    setEvents(prev => {
      original = prev.find(e => e.id === id);
      return prev
        .map(e => e.id === id ? { ...e, ...fields } : e)
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    });
    const dbFields = buildDbFields(fields, calendarEventFieldMap);
    const { error } = await supabase
      .from('calendar_events')
      .update(dbFields)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[useCalendarEvents] update failed:', error.message);
      if (original) setEvents(prev => prev.map(e => e.id === id ? original : e));
    }
  }, [userId]);

  const deleteEvent = useCallback(async (id) => {
    let removed;
    setEvents(prev => {
      removed = prev.find(e => e.id === id);
      return prev.filter(e => e.id !== id);
    });
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[useCalendarEvents] delete failed:', error.message);
      if (removed) setEvents(prev => [...prev, removed].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
    }
  }, [userId]);

  const markRead = useCallback(async (id) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
    const { error } = await supabase
      .from('calendar_events')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) console.error('[useCalendarEvents] markRead failed:', error.message);
  }, [userId]);

  const markAllDiscordRead = useCallback(async () => {
    const unreadIds = events.filter(e => e.source === 'discord' && !e.isRead).map(e => e.id);
    if (unreadIds.length === 0) return;
    setEvents(prev => prev.map(e =>
      e.source === 'discord' && !e.isRead ? { ...e, isRead: true } : e
    ));
    const { error } = await supabase
      .from('calendar_events')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('source', 'discord')
      .eq('is_read', false);
    if (error) console.error('[useCalendarEvents] markAllDiscordRead failed:', error.message);
  }, [userId, events]);

  const unreadDiscordCount = useMemo(
    () => events.filter(e => e.source === 'discord' && !e.isRead).length,
    [events]
  );

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    markRead,
    markAllDiscordRead,
    unreadDiscordCount,
  };
}
