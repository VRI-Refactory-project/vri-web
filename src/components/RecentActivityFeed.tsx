import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User } from 'lucide-react';
import { fetchUserRequests, ServiceRequest } from '../services/requests';

export const RecentActivityFeed = () => {
  const [activities, setActivities] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRequests()
      .then((data) => {
        setActivities(data.slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getActivityText = (req: ServiceRequest) => {
    const context = req.specialisation_required.toLowerCase();
    const isEmergency = req.priority === 'EMERGENCY' ? 'EMERGENCY ' : '';

    switch (req.status) {
      case 'ASSIGNED':
        return (
          <>
            <span className="font-semibold text-gray-900">{req.interpreter?.name}</span> accepted
            your {isEmergency}
            {context} request.
          </>
        );
      case 'PENDING':
      case 'OFFERED':
        return `You requested a ${isEmergency}${context} interpreter.`;
      case 'CANCELLED':
        return `You cancelled your ${isEmergency}${context} request.`;
      case 'FAILED':
        return `Your ${isEmergency}${context} request failed.`;
      default:
        return `New ${isEmergency}${context} request created.`;
    }
  };

  const getActivityTime = (req: ServiceRequest) => {
    const dateStr = req.assigned_at || req.cancelled_at || req.created_at;
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-green';
      case 'PENDING':
      case 'OFFERED':
        return 'bg-purple';
      case 'CANCELLED':
        return 'bg-red';
      case 'FAILED':
        return 'bg-blue';
      default:
        return 'bg-gray-300';
    }
  };

  if (loading)
    return (
      <p className="ih-time-label" style={{ padding: '16px' }}>
        Loading activity...
      </p>
    );
  if (activities.length === 0)
    return (
      <p className="ih-time-label" style={{ padding: '16px' }}>
        No recent sessions.
      </p>
    );

  return (
    <>
      {activities.map((req) => (
        <div key={req.id} className="ih-timeline-item">
          <div className={`ih-timeline-marker ${getDotColor(req.status)}`}></div>

          {req.status === 'ASSIGNED' && req.interpreter?.name ? (
            <div className="ih-timeline-avatar flex items-center justify-center bg-purple-100 text-purple-700 font-bold">
              {req.interpreter.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="ih-timeline-avatar flex items-center justify-center bg-gray-100">
              <User size={20} className="text-gray-400" />
            </div>
          )}

          <div className="ih-timeline-content">
            <p>{getActivityText(req)}</p>
            <span className="ih-time-label">{getActivityTime(req)}</span>
          </div>
        </div>
      ))}
    </>
  );
};
