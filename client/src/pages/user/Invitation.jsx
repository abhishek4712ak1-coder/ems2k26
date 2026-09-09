import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import {
  acceptInvitation,
  getInvitations,
  getStudentProfile,
  rejectInvitation,
} from "../../services/api.js";

const Invitation = () => {
  const [profile, setProfile] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const studentResponse = await getStudentProfile();
      setProfile(studentResponse.data);
      const list = await getInvitations();
      setInvites(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err.status === 404 || err.code === "PROFILE_NOT_FOUND") {
        setProfile(null);
      } else {
        setError(err.message || "Unable to load invitations.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (invite) => {
    setError("");
    setSuccess("");
    const key = `${invite.tid}-${invite.pid}`;
    setBusyKey(key);
    try {
      const response = await acceptInvitation(invite.tid, invite.pid);
      setSuccess(response.message || "You joined the team.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to accept invitation.");
    } finally {
      setBusyKey("");
    }
  };

  const handleReject = async (invite) => {
    if (!window.confirm("Reject this team invitation?")) {
      return;
    }
    setError("");
    setSuccess("");
    const key = `${invite.tid}-${invite.pid}`;
    setBusyKey(key);
    try {
      const response = await rejectInvitation(invite.tid, invite.pid);
      setSuccess(response.message || "Invitation declined.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to reject invitation.");
    } finally {
      setBusyKey("");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <>
        <Helmet>
          <title>Invitations | ZEST 2K26</title>
        </Helmet>
        <div className="glass panel empty">
          <div className="kicker">Profile required</div>
          <h2>Create your profile to see invitations</h2>
          <p>Team invites are sent to your registered student account.</p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" to="/profile">
              Create profile
            </Link>
          </div>
        </div>
      </>
    );
  }

  const pending = invites.filter((item) => Number(item.status) !== 1);

  return (
    <>
      <Helmet>
        <title>Invitations | ZEST 2K26</title>
      </Helmet>

      <div className="section-title">
        <div>
          <div className="kicker">Teams</div>
          <h2>Invitations</h2>
          <p>Accept a team invite to confirm your place in that event.</p>
        </div>
      </div>

      {success ? <div className="alert ok">{success}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}

      {pending.length === 0 ? (
        <div className="glass invite-card">
          <div className="kicker">All caught up</div>
          <h2>No pending invitations</h2>
          <p>When a team leader adds your PID, the invite will show up here.</p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" to="/participation">
              Browse events
            </Link>
          </div>
        </div>
      ) : (
        <div className="event-grid">
          {pending.map((invite) => {
            const key = `${invite.tid}-${invite.pid}`;
            const busy = busyKey === key;
            return (
              <article className="glass event-card" key={key}>
                <span className="badge pink">{invite.event}</span>
                <h3>{invite.team_name}</h3>
                <p>Team ID: {invite.tid}</p>
                <small>Invited PID: {invite.pid}</small>
                <div className="actions">
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => handleAccept(invite)}
                  >
                    {busy ? "Please wait..." : "Accept"}
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() => handleReject(invite)}
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Invitation;
