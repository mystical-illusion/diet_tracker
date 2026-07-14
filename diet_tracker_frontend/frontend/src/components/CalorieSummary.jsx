export default function CalorieSummary({ totals, goal }) {
  const cals = totals?.calories || 0;
  const goalCal = goal?.daily_goal || 2000; // ← fixed!
  const logged = cals;
  const remaining = Math.max(goalCal - cals, 0);
  const pct = Math.min((cals / goalCal) * 100, 100).toFixed(0);

  return (
    <div className="card energy-card">
      <div className="row-between">
        <div>
          <div className="row gap-2 mb-2">
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              Energy Intake Summary
            </span>
          </div>
          <p className="text-xs text-subtle">
            Realtime tracker metrics for today
          </p>
        </div>
        <span className="badge badge-cyan">{pct}% Completed</span>
      </div>

      <div className="energy-grid">
        <div className="energy-cell">
          <div className="energy-cell-label">Goal Target</div>
          <div className="energy-cell-value">{goalCal}</div>
          <div className="energy-cell-unit">kcal</div>
        </div>
        <div className="energy-cell">
          <div className="energy-cell-label">Logged</div>
          <div className="energy-cell-value" style={{ color: "var(--cyan)" }}>
            {logged.toFixed(0)}
          </div>
          <div className="energy-cell-unit">kcal</div>
        </div>
        <div className="energy-cell">
          <div className="energy-cell-label">Remaining</div>
          <div className="energy-cell-value">{remaining.toFixed(0)}</div>
          <div className="energy-cell-unit">kcal</div>
        </div>
      </div>

      <div className="energy-hint mt-3">
        <span>⚡</span>
        <span>
          You can fuel up to <strong>{remaining.toFixed(0)} kcal</strong> more
          today.
        </span>
      </div>
    </div>
  );
}
