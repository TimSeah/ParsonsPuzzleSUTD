const STATUSES = {
  loading: { label: 'Connecting…', detail: 'Checking the puzzle server' },
  online: { label: 'Online', detail: 'Puzzles are loaded from the course database' },
  offline: { label: 'Offline', detail: 'Using the bundled puzzles in this app' },
};

// Small inline pill showing where puzzles are coming from.
const StatusIndicator = ({ isUsingApi, isLoading = false }) => {
  const type = isLoading ? 'loading' : isUsingApi ? 'online' : 'offline';
  const status = STATUSES[type];

  return (
    <span className="badge" role="status" title={status.detail}>
      <span className={`status-dot status-dot--${type}`} aria-hidden="true" />
      {status.label}
      <span className="visually-hidden">: {status.detail}</span>
    </span>
  );
};

export default StatusIndicator;
