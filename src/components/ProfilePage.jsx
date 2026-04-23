import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfilePage({ user, profile, onUpdateProfile, onBack, onSignOut }) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [birthday, setBirthday] = useState(profile.birthday);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const initials = displayName
    ? (profile.firstName[0] || '') + (profile.lastName[0] || '')
    : user.email.split('@')[0].slice(0, 2);

  const createdAt = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = data.publicUrl + '?t=' + Date.now();
      setAvatarUrl(url);
      await onUpdateProfile({ avatarUrl: url });
    }
    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl('');
    await onUpdateProfile({ avatarUrl: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onUpdateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday: birthday || null,
      bio: bio.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    birthday !== profile.birthday ||
    bio !== profile.bio;

  return (
    <div className="profile-page">
      <div className="profile-page-card">
        <button className="profile-back-btn" onClick={onBack}>&larr; Back</button>

        <div className="profile-page-header">
          <div className="avatar-upload-wrapper" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="profile-avatar-img xlarge" />
            ) : (
              <span className="profile-avatar xlarge">{initials.toUpperCase()}</span>
            )}
            <div className="avatar-overlay">
              {uploading ? '...' : '📷'}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              hidden
            />
          </div>
          <div className="profile-page-meta">
            {displayName && <span className="profile-page-name">{displayName}</span>}
            <span className="profile-page-email">{user.email}</span>
            <span className="profile-page-joined">Member since {createdAt}</span>
            {avatarUrl && (
              <button type="button" className="btn-remove-avatar" onClick={handleRemoveAvatar}>
                Remove photo
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-name-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              className="profile-bio-input"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>
          <div className="profile-form-actions">
            <button
              type="submit"
              className="btn-save-profile"
              disabled={!hasChanges}
            >
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
            <button type="button" className="btn-signout-profile" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
