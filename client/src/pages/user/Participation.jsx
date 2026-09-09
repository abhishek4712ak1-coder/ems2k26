import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import {
  checkPid,
  deleteTeam,
  getIndividualEvents,
  getIndividualParticipation,
  getStudentProfile,
  getTeamEvents,
  getTeamParticipation,
  saveIndividualEvents,
  saveTeam,
} from "../../services/api.js";

const normalizePid = (value) => String(value || "").trim().toUpperCase();

const eventName = (item) => item?.event || item?.name || "";

const isHalted = (item) => Number(item?.halt) === 1;

const Participation = () => {
  const [tab, setTab] = useState("individual");
  const [profile, setProfile] = useState(null);
  const [individualCatalog, setIndividualCatalog] = useState([]);
  const [teamCatalog, setTeamCatalog] = useState([]);
  const [selected, setSelected] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [teamForm, setTeamForm] = useState({
    name: "",
    event: "",
    pidInput: "",
  });
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [busyTid, setBusyTid] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const studentResponse = await getStudentProfile();
      const student = studentResponse.data;
      setProfile(student);

      const [individualList, teamList, individualJoined, teamJoined] =
        await Promise.all([
          getIndividualEvents(),
          getTeamEvents(),
          getIndividualParticipation(),
          getTeamParticipation(),
        ]);

      setIndividualCatalog(individualList);
      setTeamCatalog(teamList);
      setSelected(individualJoined?.data?.events || []);
      setMyTeams(teamJoined?.data || []);

      const ownPid = normalizePid(student.pid);
      setMembers((current) => {
        if (current.some((member) => member.pid === ownPid)) {
          return current;
        }
        return [
          {
            pid: ownPid,
            name: student.name,
            self: true,
          },
          ...current,
        ];
      });
    } catch (err) {
      if (err.status === 404 || err.code === "PROFILE_NOT_FOUND") {
        setProfile(null);
      } else {
        setError(err.message || "Unable to load events.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedEvent = useMemo(
    () => teamCatalog.find((item) => eventName(item) === teamForm.event),
    [teamCatalog, teamForm.event]
  );

  const memberLimit = Number(selectedEvent?.limit) || 0;

  const toggleEvent = (name, halted) => {
    if (halted) {
      return;
    }
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  };

  const handleSaveIndividual = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      const response = await saveIndividualEvents(selected);
      setSuccess(response.message || "Individual events saved.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to save individual events.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckPid = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const pid = normalizePid(teamForm.pidInput);
    if (!pid) {
      setError("Enter a participant ID to add.");
      return;
    }

    if (members.some((member) => member.pid === pid)) {
      setError("That participant is already on this team list.");
      return;
    }

    if (memberLimit && members.length >= memberLimit) {
      setError(`This event allows a maximum of ${memberLimit} members.`);
      return;
    }

    try {
      setChecking(true);
      const response = await checkPid(pid);
      const student = response.data || {};
      setMembers((current) => [
        ...current,
        {
          pid,
          name: student.name || pid,
          self: false,
        },
      ]);
      setTeamForm((current) => ({ ...current, pidInput: "" }));
      setSuccess(`${student.name || pid} can join this team.`);
    } catch (err) {
      setError(err.message || "Unable to verify that participant ID.");
    } finally {
      setChecking(false);
    }
  };

  const removeMember = (pid) => {
    setMembers((current) =>
      current.filter((member) => member.self || member.pid !== pid)
    );
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!teamForm.name.trim() || !teamForm.event) {
      setError("Team name and event are required.");
      return;
    }

    if (members.length < 1) {
      setError("Add at least your participant ID to the team.");
      return;
    }

    if (memberLimit && members.length > memberLimit) {
      setError(`This event allows a maximum of ${memberLimit} members.`);
      return;
    }

    try {
      setSaving(true);
      const response = await saveTeam({
        name: teamForm.name.trim(),
        event: teamForm.event,
        members: members.map((member) => member.pid),
      });
      setSuccess(
        response.message ||
          "Team created. Ask members to accept their invitations."
      );
      setTeamForm({ name: "", event: "", pidInput: "" });
      setMembers(
        profile
          ? [{ pid: normalizePid(profile.pid), name: profile.name, self: true }]
          : []
      );
      await load();
    } catch (err) {
      setError(err.message || "Unable to create team.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (tid) => {
    if (!window.confirm("Delete this team? This cannot be undone.")) {
      return;
    }
    setError("");
    setSuccess("");
    setBusyTid(tid);
    try {
      const response = await deleteTeam(tid);
      setSuccess(response.message || "Team deleted.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete team.");
    } finally {
      setBusyTid("");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <>
        <Helmet>
          <title>Participation | ZEST 2K26</title>
        </Helmet>
        <div className="glass panel empty">
          <div className="kicker">Profile required</div>
          <h2>Complete your student profile first</h2>
          <p>
            Event registration uses your participant ID. Create your profile to
            join individual and team events.
          </p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" to="/profile">
              Create profile
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Participation | ZEST 2K26</title>
      </Helmet>

      <div className="section-title">
        <div>
          <div className="kicker">Events</div>
          <h2>Participation</h2>
          <p>
            Select individual events, or create a team and invite members by
            participant ID.
          </p>
        </div>
        <div className="pid-chip">
          <div>
            <small>Your PID</small>
            <strong>{profile.pid}</strong>
          </div>
        </div>
      </div>

      {success ? <div className="alert ok">{success}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}

      <div className="tab-bar" role="tablist">
        <button
          type="button"
          className={tab === "individual" ? "active" : ""}
          onClick={() => setTab("individual")}
        >
          Individual
        </button>
        <button
          type="button"
          className={tab === "team" ? "active" : ""}
          onClick={() => setTab("team")}
        >
          Team
        </button>
        <button
          type="button"
          className={tab === "mine" ? "active" : ""}
          onClick={() => setTab("mine")}
        >
          My teams
        </button>
      </div>

      {tab === "individual" ? (
        <form className="glass panel" onSubmit={handleSaveIndividual}>
          <p className="hint">
            Tick the events you want, then save. Campus students can join up to
            6 events in total; other colleges can join up to 8.
          </p>
          <div className="event-grid">
            {individualCatalog.length === 0 ? (
              <div className="empty">No individual events are listed yet.</div>
            ) : (
              individualCatalog.map((item) => {
                const name = eventName(item);
                const halted = isHalted(item);
                const checked = selected.includes(name);
                return (
                  <label
                    className={`glass event-card selectable${
                      checked ? " selected" : ""
                    }`}
                    key={name}
                  >
                    <span className="badge cyan">Individual</span>
                    <h3>{name}</h3>
                    <p>{item.description || "Details will be announced."}</p>
                    <small>
                      {item.venue || "Venue TBA"} · {item.time || "Schedule TBA"}
                    </small>
                    {halted ? (
                      <span className="badge warn">Registration closed</span>
                    ) : (
                      <span className="check-row">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEvent(name, halted)}
                        />
                        Join this event
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
          <div className="actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save individual events"}
            </button>
            <Link className="btn btn-ghost" to="/invitation">
              Open invitations
            </Link>
          </div>
        </form>
      ) : null}

      {tab === "team" ? (
        <form className="glass panel" onSubmit={handleCreateTeam}>
          <div className="form-grid">
            <label className="field">
              Team name
              <input
                value={teamForm.name}
                onChange={(event) =>
                  setTeamForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                maxLength={60}
                required
                placeholder="Your crew name"
              />
            </label>
            <label className="field">
              Event
              <select
                value={teamForm.event}
                onChange={(event) =>
                  setTeamForm((current) => ({
                    ...current,
                    event: event.target.value,
                  }))
                }
                required
              >
                <option value="">Select a team event</option>
                {teamCatalog.map((item) => {
                  const name = eventName(item);
                  return (
                    <option
                      key={name}
                      value={name}
                      disabled={isHalted(item)}
                    >
                      {name}
                      {isHalted(item) ? " (closed)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {selectedEvent ? (
            <p className="hint">
              {selectedEvent.description || ""} Max members:{" "}
              {selectedEvent.limit || "not specified"}. Venue:{" "}
              {selectedEvent.venue || "TBA"}.
            </p>
          ) : null}

          <div className="member-box">
            <strong>Members</strong>
            <p className="hint">
              Your PID is included. Add teammates by PID, then create the team.
              Everyone (including you) must accept the invitation.
            </p>
            <ul className="member-list">
              {members.map((member) => (
                <li key={member.pid}>
                  <span>
                    {member.name} <em>{member.pid}</em>
                    {member.self ? " · you" : ""}
                  </span>
                  {member.self ? null : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeMember(member.pid)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="pid-row">
              <label className="field">
                Teammate PID
                <input
                  value={teamForm.pidInput}
                  onChange={(event) =>
                    setTeamForm((current) => ({
                      ...current,
                      pidInput: normalizePid(event.target.value),
                    }))
                  }
                  placeholder="P12"
                />
              </label>
              <button
                type="button"
                className="btn btn-gold"
                disabled={checking}
                onClick={handleCheckPid}
              >
                {checking ? "Checking..." : "Add member"}
              </button>
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Create team & send invites"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "mine" ? (
        <div className="event-grid">
          {myTeams.length === 0 ? (
            <div className="glass panel empty">
              You have not confirmed any team yet. Create a team, then accept
              your invitation.
            </div>
          ) : (
            myTeams.map((team) => (
              <article className="glass event-card" key={team.tid}>
                <span className="badge pink">{team.event}</span>
                <h3>{team.name}</h3>
                <p>Team ID: {team.tid}</p>
                <small>
                  Members: {(team.actual_members || []).join(", ") || "Pending"}
                </small>
                {team.created_by === profile.email ? (
                  <button
                    className="btn btn-danger"
                    disabled={busyTid === team.tid}
                    onClick={() => handleDeleteTeam(team.tid)}
                  >
                    {busyTid === team.tid ? "Deleting..." : "Delete team"}
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      ) : null}
    </>
  );
};

export default Participation;
