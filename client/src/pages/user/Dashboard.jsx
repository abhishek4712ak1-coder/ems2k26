import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import useAuth from "../../context/useAuth.js";
import {
  getDashboard,
  getIndividualParticipation,
  getInvitations,
  getTeamParticipation,
} from "../../services/api.js";

const Dashboard = () => {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    individual: 0,
    teams: 0,
    invites: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getDashboard();
        const payload = response?.data || null;

        if (!cancelled) {
          setData(payload);
        }

        if (payload?.student) {
          const [individual, teams, invites] = await Promise.all([
            getIndividualParticipation(),
            getTeamParticipation(),
            getInvitations(),
          ]);

          if (!cancelled) {
            setCounts({
              individual: individual?.data?.events?.length || 0,
              teams: teams?.data?.length || 0,
              invites: Array.isArray(invites) ? invites.length : 0,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const student = data?.student || null;

  const displayName =
    student?.name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Participant";

  if (loading) {
    return (
      <section className="hero">
        <div
          className="glass hero-card"
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div className="kicker">ZEST 2K26 · SRMS CET</div>
          <h1>
            Loading <span>Dashboard...</span>
          </h1>
        </div>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | ZEST 2K26</title>
      </Helmet>

      {error ? <div className="alert err">{error}</div> : null}

      <section className="hero">
        <div className="glass hero-card">
          <div className="hero-top">
            <div className="kicker">ZEST 2K26 · SRMS CET</div>
            <div className="festival-note">
              <span>01</span> The campus is your stage
            </div>
          </div>

          <h1>
            Hello, <span>{displayName}</span>
          </h1>

          {!student ? (
            <>
              <p>
                Create your student profile to get a participant ID, then join
                events and accept team invitations.
              </p>
              <div className="actions">
                <Link className="btn btn-primary" to="/profile">
                  Create Student Profile
                </Link>
              </div>
            </>
          ) : (
            <>
              <p>
                Your profile is ready. Join events, build a team, and keep an
                eye on invitations.
              </p>
              <div className="pid-chip">
                <div>
                  <small>Participant ID</small>
                  <strong>{student.pid}</strong>
                </div>
                <span
                  className={`badge ${
                    student.verified === true || student.verified === 1
                      ? "ok"
                      : "warn"
                  }`}
                >
                  {student.verified === true || student.verified === 1
                    ? "Verified"
                    : "Pending verification"}
                </span>
              </div>
              <div className="actions">
                <Link className="btn btn-primary" to="/participation">
                  Join events
                </Link>
                <Link className="btn btn-gold" to="/invitation">
                  Invitations
                </Link>
              </div>
            </>
          )}
        </div>

        {student ? (
          <div className="stats">
            <div className="glass stat">
              <span>Individual events</span>
              <strong>{counts.individual}</strong>
              <em>Saved selections</em>
            </div>
            <div className="glass stat">
              <span>Confirmed teams</span>
              <strong>{counts.teams}</strong>
              <em>After you accept</em>
            </div>
            <div className="glass stat">
              <span>Invitations</span>
              <strong>{counts.invites}</strong>
              <em>Waiting for you</em>
            </div>
          </div>
        ) : (
          <div className="glass hero-card">
            <div className="kicker">Next step</div>
            <h2>How registration works</h2>
            <p>
              1. Create your account and verify email.
              <br />
              2. Complete your student profile and upload your ID card.
              <br />
              3. Join individual events or create a team with PIDs.
            </p>
          </div>
        )}
      </section>

      {student ? (
        <section className="glass panel">
          <div className="section-title">
            <div>
              <h2>Student Profile</h2>
              <p>Your registered information for ZEST 2K26.</p>
            </div>
          </div>

          <div className="info-list">
            <div className="info-item">
              <span>Full Name</span>
              <strong>{student.name}</strong>
            </div>
            <div className="info-item">
              <span>Email Address</span>
              <strong>{student.email}</strong>
            </div>
            <div className="info-item">
              <span>Student ID</span>
              <strong>{student.rollno}</strong>
            </div>
            <div className="info-item">
              <span>Participant ID</span>
              <strong>{student.pid}</strong>
            </div>
            <div className="info-item">
              <span>Phone Number</span>
              <strong>{student.phone}</strong>
            </div>
            <div className="info-item">
              <span>College</span>
              <strong>{student.college}</strong>
            </div>
            <div className="info-item">
              <span>Branch</span>
              <strong>{student.branch}</strong>
            </div>
            <div className="info-item">
              <span>Year</span>
              <strong>{student.year}</strong>
            </div>
            <div className="info-item">
              <span>Gender</span>
              <strong>{student.gender}</strong>
            </div>
            <div className="info-item">
              <span>Accommodation</span>
              <strong>{student.accomodation}</strong>
            </div>
            <div className="info-item" style={{ gridColumn: "1 / -1" }}>
              <span>Address</span>
              <strong>{student.address}</strong>
            </div>
          </div>

          <div className="actions">
            <Link className="btn btn-ghost" to="/profile">
              View / Edit Profile
            </Link>
          </div>
        </section>
      ) : null}

      <footer className="site-footer">
        Shri Ram Murti Smarak College of Engineering & Technology, Bareilly
        <br />
        © 2026 ZEST 2K26
      </footer>
    </>
  );
};

export default Dashboard;
