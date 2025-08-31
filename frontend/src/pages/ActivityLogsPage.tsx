import { useEffect, useState } from 'react';
import { getActivityLogs } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getActivityLogs();
        setLogs(data);
      } catch (ex: any) {
        console.error('Failed to load activity logs', ex);
        setError(ex?.response?.data?.message ?? ex?.message ?? 'Failed to load activity logs');
      }
    })();
  }, []);

  return (
    <SectionPage kicker="Audit" title="Activity Logs" description="Track important actions for accountability and coursework review.">
      {error ? (
        <div className="panel">
          <p style={{ color: 'var(--muted)' }}>{error}</p>
          <p style={{ color: 'var(--muted)' }}>Ensure you are signed in with an Admin account to view activity logs.</p>
        </div>
      ) : (
        <div className="panel table-panel">
          <table className="erp-table">
            <thead><tr><th>Action</th><th>Entity</th><th>By</th><th>When</th><th>Details</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log.id}><td>{log.action}</td><td>{log.entityName ?? '-'}</td><td>{log.performedByUserId ?? '-'}</td><td>{new Date(log.createdAt).toLocaleString()}</td><td>{log.details ?? '-'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </SectionPage>
  );
}