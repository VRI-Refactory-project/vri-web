import { X, CheckCircle2 } from 'lucide-react';
import type { AppNotification } from '../../services/notifications';

interface Props {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdown({ notifications, onClose, onMarkAllRead }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '12px',
        width: '320px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
          Notifications
        </h4>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '11px',
              color: '#382c77',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Mark all as read
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
            No notifications yet.
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '16px',
                borderBottom: '1px solid #f1f5f9',
                background: n.read_at ? '#fff' : '#f8fafc',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ marginTop: '2px', color: n.read_at ? '#94a3b8' : '#382c77' }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: '13px',
                    fontWeight: n.read_at ? 500 : 700,
                    color: '#1e293b',
                  }}
                >
                  {n.title}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                  {n.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
