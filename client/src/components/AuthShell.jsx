const AuthShell = ({ title, subtitle, children, footer }) => {
  return (
    <div className="auth-screen">
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
