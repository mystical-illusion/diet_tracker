export default function ProgressBar({ label, consumed, goal, unit = 'g', color = 'cyan' }) {
  const pct   = goal ? Math.min((consumed / goal) * 100, 100) : 0
  const over  = goal && consumed > goal
  const remaining = Math.max(goal - consumed, 0)
  const fillClass = over ? 'progress-fill--over'
    : color === 'blue'   ? 'progress-fill--blue'
    : color === 'orange' ? 'progress-fill--orange'
    : ''

  return (
    <div className="progress-wrap">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-nums">{consumed.toFixed(0)}<span style={{color:'var(--text-subtle)'}}>/{goal}{unit}</span></span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`progress-note ${over ? 'progress-note--over' : ''}`}>
        {over ? `${(consumed - goal).toFixed(0)}${unit} over goal` : `${remaining.toFixed(0)}${unit} remaining`}
      </span>
    </div>
  )
}