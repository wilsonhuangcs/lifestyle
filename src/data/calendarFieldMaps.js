// ============================================================
// Calendar — Field Maps
// ============================================================
// DB ↔ JS mappings for the calendar_events table.
// rowMap   — snake_case (DB) → camelCase (JS), used with mapRow()
// fieldMap — camelCase (JS) → snake_case (DB), used with buildDbFields()
// ============================================================

export const calendarEventRowMap = {
  id: 'id',
  user_id: 'userId',
  title: 'title',
  description: 'description',
  starts_at: 'startsAt',
  ends_at: 'endsAt',
  location: 'location',
  source: 'source',
  source_message_id: 'sourceMessageId',
  source_url: 'sourceUrl',
  is_read: 'isRead',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

export const calendarEventFieldMap = {
  id: 'id',
  userId: 'user_id',
  title: 'title',
  description: 'description',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  location: 'location',
  source: 'source',
  sourceMessageId: 'source_message_id',
  sourceUrl: 'source_url',
  isRead: 'is_read',
};
