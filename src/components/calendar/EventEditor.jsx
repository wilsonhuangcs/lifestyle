import { useState, useEffect } from 'react';
import DatePicker from '../DatePicker';

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toLocalTimeStr(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function combineDateTimeToIso(dateStr, timeStr) {
  // dateStr "YYYY-MM-DD", timeStr "HH:MM" → local-time ISO string
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

function defaultStart() {
  const d = new Date();
  // round to next 30-min slot
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

export default function EventEditor({ event, defaultDate, onSave, onDelete, onClose }) {
  const isEdit = !!event;
  const isDiscord = event?.source === 'discord';

  const initialStart = event?.startsAt
    ? new Date(event.startsAt)
    : defaultDate
      ? new Date(`${defaultDate}T${toLocalTimeStr(defaultStart())}:00`)
      : defaultStart();

  const initialEnd = event?.endsAt ? new Date(event.endsAt) : null;

  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(toLocalDateStr(initialStart));
  const [startTime, setStartTime] = useState(toLocalTimeStr(initialStart));
  const [hasEnd, setHasEnd] = useState(!!initialEnd);
  const [endTime, setEndTime] = useState(initialEnd ? toLocalTimeStr(initialEnd) : startTime);
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const startsAt = combineDateTimeToIso(date, startTime);
    const endsAt = hasEnd ? combineDateTimeToIso(date, endTime) : null;

    setSaving(true);
    await onSave({
      title: trimmedTitle,
      startsAt,
      endsAt,
      location: location.trim() || null,
      description: description.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return;
    setSaving(true);
    await onDelete(event.id);
    setSaving(false);
    onClose();
  };

  return (
    <div className="cal-modal-backdrop" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cal-modal-head">
          <h2>{isEdit ? 'Edit event' : 'New event'}</h2>
          <button className="cal-modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {isDiscord && (
          <div className="cal-modal-source-note">
            <span className="material-icons">smart_toy</span>
            Imported from Discord
            {event.sourceUrl && (
              <>
                {' · '}
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">View original</a>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="cal-modal-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="cal-modal-time-row">
            <div className="form-group">
              <label>Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={hasEnd}
                  onChange={(e) => setHasEnd(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!hasEnd}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location <span className="cal-modal-optional">(optional)</span></label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where?"
            />
          </div>

          <div className="form-group">
            <label>Notes <span className="cal-modal-optional">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details to remember…"
              rows={3}
            />
          </div>

          <div className="cal-modal-actions">
            {isEdit && (
              <button
                type="button"
                className="cal-modal-delete"
                onClick={handleDelete}
                disabled={saving}
              >
                Delete
              </button>
            )}
            <div className="cal-modal-actions-right">
              <button type="button" className="cal-modal-cancel" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="cal-modal-save" disabled={saving || !title.trim()}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
