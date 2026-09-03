import { Link } from "react-router-dom";
import { ClipboardCheck, FileText, FlaskConical, History } from "lucide-react";
import { formatRelativeTime } from "../../services/dashboard/dashboardService";
import { ACTIVITY_TYPE_LABELS } from "../../types/dashboard";
import type { ActivityType, DashboardActivityItem } from "../../types/dashboard";

const ACTIVITY_ICONS: Record<ActivityType, typeof FlaskConical> = {
  experiment: FlaskConical,
  quiz: ClipboardCheck,
  report: FileText,
};

type RecentActivityProps = {
  activity: DashboardActivityItem[];
};

/**
 * "What did I recently do?" — quizzes taken and reports generated,
 * newest first, with relative timestamps.
 */
function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <section className="dashboard-panel" aria-label="Recent activity">
      <div className="dashboard-panel-head">
        <h2 className="dashboard-panel-title">Recent activity</h2>
      </div>

      {activity.length === 0 ? (
        <p className="dashboard-activity-empty">
          Your quiz attempts and lab reports will appear here as you work through experiments.
        </p>
      ) : (
        <ul className="dashboard-activity-list">
          {activity.map((item) => {
            const Icon = ACTIVITY_ICONS[item.type];
            return (
              <li key={`${item.type}-${item.id}`}>
                <Link to={item.href} className="dashboard-activity-item" title={ACTIVITY_TYPE_LABELS[item.type]}>
                  <span className="dashboard-activity-icon">
                    <Icon size={16} />
                  </span>
                  <span className="dashboard-activity-body">
                    <span className="dashboard-activity-title">{item.title}</span>
                    <span className="dashboard-activity-description">{item.description}</span>
                  </span>
                  <span className="dashboard-activity-time">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="dashboard-panel-foot">
        <Link to="/reports" className="dashboard-panel-link">
          <History size={13} /> View all reports
        </Link>
      </div>
    </section>
  );
}

export default RecentActivity;
