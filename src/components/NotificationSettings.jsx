import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function NotificationSettings({ userId }) {
  const { supported, permission, isSubscribed, busy, error, subscribe, unsubscribe } =
    usePushNotifications(userId);
  const [testStatus, setTestStatus] = useState(null); // { ok: bool, message: string }
  const [testBusy, setTestBusy] = useState(false);

  const handleTestPush = async () => {
    setTestBusy(true);
    setTestStatus(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke('push-test', {
        body: { title: 'Lifestyle test push', body: 'Push is working end-to-end.' },
      });
      if (invokeErr) {
        setTestStatus({ ok: false, message: invokeErr.message || 'Failed to invoke push-test.' });
      } else if (data?.sent > 0) {
        setTestStatus({ ok: true, message: `Sent to ${data.sent}/${data.total} device(s).` });
      } else {
        setTestStatus({ ok: false, message: data?.message || 'No devices received the push.' });
      }
    } catch (e) {
      setTestStatus({ ok: false, message: e.message || 'Test push failed.' });
    }
    setTestBusy(false);
  };

  if (!supported) {
    return (
      <div className="notif-settings">
        <h3 className="notif-settings-title">Push notifications</h3>
        <p className="notif-settings-note notif-settings-note--warn">
          Your browser doesn&rsquo;t support web push notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="notif-settings">
      <h3 className="notif-settings-title">Push notifications</h3>
      <p className="notif-settings-desc">
        Get notified when a new Pokemon drop is added from Discord. Works on desktop and on
        mobile when you install this app to your home screen.
      </p>

      {permission === 'denied' && (
        <p className="notif-settings-note notif-settings-note--warn">
          Notifications are blocked for this site. Enable them in your browser&rsquo;s site
          settings, then return here.
        </p>
      )}

      {error && (
        <p className="notif-settings-note notif-settings-note--err">{error}</p>
      )}

      <div className="notif-settings-row">
        <div className="notif-settings-state">
          <span className={`notif-dot ${isSubscribed ? 'on' : 'off'}`} />
          <span>
            {isSubscribed
              ? 'Enabled on this device'
              : permission === 'denied'
                ? 'Blocked'
                : 'Off'}
          </span>
        </div>
        {isSubscribed ? (
          <button
            type="button"
            className="btn-notif-toggle btn-notif-toggle--off"
            onClick={unsubscribe}
            disabled={busy}
          >
            {busy ? 'Disabling…' : 'Disable on this device'}
          </button>
        ) : (
          <button
            type="button"
            className="btn-notif-toggle"
            onClick={subscribe}
            disabled={busy || permission === 'denied'}
          >
            {busy ? 'Enabling…' : 'Enable notifications'}
          </button>
        )}
      </div>

      {isSubscribed && (
        <div className="notif-test-row">
          <button
            type="button"
            className="btn-notif-test"
            onClick={handleTestPush}
            disabled={testBusy}
          >
            {testBusy ? 'Sending…' : 'Send test push'}
          </button>
          {testStatus && (
            <span className={`notif-test-status ${testStatus.ok ? 'ok' : 'err'}`}>
              {testStatus.message}
            </span>
          )}
        </div>
      )}

      <p className="notif-settings-hint">
        iOS users: notifications only work after you &ldquo;Add to Home Screen&rdquo; from Safari
        on iOS 16.4 or later.
      </p>
    </div>
  );
}
