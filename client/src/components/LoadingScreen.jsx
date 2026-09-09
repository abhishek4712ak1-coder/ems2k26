const LoadingScreen = () => {
  return (
    <div className="auth-screen">
      <div style={{ textAlign: "center" }}>
        <div className="brand" style={{ justifyContent: "center", marginBottom: 18 }}>
          <div className="brand-mark">Z</div>
          <div className="brand-copy">
            <strong>
              ZEST <span>2K26</span>
            </strong>
            <small>Loading</small>
          </div>
        </div>
        <p style={{ color: "var(--muted)" }}>Getting things ready...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
