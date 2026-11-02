import { REPORT_KINDS } from '../lib/reports.js';
import { hazardSvg, HAZARD_STYLE } from '../lib/hazardIcons.js';

export function ReportButton({ onClick }) {
  return (
    <button className="report-fab" onClick={onClick} aria-label="Report something on the road">
      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 4 21 19H3Z" /><path d="M12 10v4M12 16.6v.4" /></svg>
      <span>Report</span>
    </button>
  );
}

export function ReportSheet({ onPick, onClose, note }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet report-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Report">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>What did you see?</h2>
          <button className="icon-btn ghost" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="report-grid">
          {REPORT_KINDS.map((k) => {
            const st = HAZARD_STYLE[k.kind] || HAZARD_STYLE.hazard;
            return (
              <button key={k.id} className="report-tile" style={{ '--hz': st.color }} onClick={() => onPick(k.id)}>
                <span className="report-icon" dangerouslySetInnerHTML={{ __html: hazardSvg(k.kind, 30) }} />
                <span>{k.label}</span>
              </button>
            );
          })}
        </div>
        <p className="hint">
          Pins it where you are right now, in your direction of travel. Hands-free: tap the mic and say
          &ldquo;report police&rdquo;, &ldquo;report a crash&rdquo; or &ldquo;hazard ahead&rdquo;.
        </p>
        {note && <p className="hint warn">{note}</p>}
      </div>
    </div>
  );
}

export function ConfirmCard({ hazard, onVote }) {
  if (!hazard) return null;
  const st = HAZARD_STYLE[hazard.kind] || HAZARD_STYLE.hazard;
  return (
    <div className="confirm-card" style={{ '--hz': st.color }} role="status">
      <span className="hazard-dot" dangerouslySetInnerHTML={{ __html: hazardSvg(hazard.kind, 16) }} />
      <strong>{st.label} still there?</strong>
      <button className="chip on" onClick={() => onVote(true)}>Yes</button>
      <button className="chip" onClick={() => onVote(false)}>Gone</button>
    </div>
  );
}
