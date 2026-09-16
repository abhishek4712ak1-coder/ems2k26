const AuthShell = ({ title, subtitle, children, footer }) => {
  return (
    <div className="auth-screen">
      <aside className="auth-showcase" aria-label="ZEST 2K26 introduction">
        <div className="showcase-topline">SRMS CET / BAREILLY / 2026</div>
        <div className="showcase-mark">Z<span>EST26</span></div>
        <p className="showcase-kicker">The campus is your stage</p>
        <h2>Make a little<br /><em>noise.</em></h2>
        <p className="showcase-copy">
          Find your people, pick your events, and leave with a story worth
          retelling.
        </p>
        <div className="showcase-stamps">
          <span>CREATE</span><span>COMPETE</span><span>CELEBRATE</span>
        </div>
      </aside>
      <div className="glass auth-card">
        <div className="brand" style={{ marginBottom: 8 }}>
          <div className="brand-mark">Z</div>
          <div className="brand-copy">
            <strong>
              ZEST <span>2K26</span>
            </strong>
            <small>SRMS CET Bareilly</small>
          </div>
        </div>
        <h1>{title}</h1>
        {subtitle ? <p className="lead">{subtitle}</p> : null}
        {children}
        {footer}
      </div>
    </div>
  );
};

export default AuthShell;
