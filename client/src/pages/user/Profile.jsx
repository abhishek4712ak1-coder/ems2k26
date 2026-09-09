import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import LoadingScreen from "../../components/LoadingScreen";
import useAuth from "../../context/useAuth.js";
import {
  changePassword,
  getStudentProfile,
  saveStudentProfile,
} from "../../services/api.js";

const emptyForm = {
  name: "",
  rollno: "",
  phone: "",
  gender: "",
  accomodation: "",
  address: "",
  college: "",
  branch: "",
  year: "",
};

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [mode, setMode] = useState("menu");
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [idCard, setIdCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getStudentProfile();
      const profile = response.data;
      setData(profile);
      setForm({
        name: profile.name || "",
        rollno: profile.rollno || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        accomodation: profile.accomodation || "",
        address: profile.address || "",
        college: profile.college || "",
        branch: profile.branch || "",
        year: profile.year ? String(profile.year) : "",
      });
    } catch (err) {
      if (err.status === 404 || err.code === "PROFILE_NOT_FOUND") {
        setData(null);
        setMode("edit");
        setForm((current) => ({
          ...current,
          name: current.name || user?.name || "",
        }));
      } else {
        setError(err.message || "Unable to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError("Phone number must be 10 digits.");
      return;
    }

    if (!data && !idCard) {
      setError("Please upload a photo of your student ID card.");
      return;
    }

    if (idCard && idCard.size > 5 * 1024 * 1024) {
      setError("ID card image must be 5MB or smaller.");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        payload.append(key, value);
      });
      if (idCard) {
        payload.append("idCard", idCard);
      }
      const response = await saveStudentProfile(payload);
      setData(response.data);
      setIdCard(null);
      setMode("menu");
      setSuccess(response.message || "Profile saved successfully.");
      await checkAuth();
    } catch (err) {
      setError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (passwordForm.newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      const response = await changePassword(passwordForm);
      setSuccess(response.message || "Password updated.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMode("menu");
    } catch (err) {
      setError(err.message || "Unable to change password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title>Profile | ZEST 2K26</title>
      </Helmet>

      <div className="section-title">
        <div>
          <div className="kicker">Account</div>
          <h2>Profile</h2>
          <p>Edit your student details or update your password.</p>
        </div>
      </div>

      {success ? <div className="alert ok">{success}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}

      {mode === "menu" ? (
        <>
          {data ? (
            <section className="glass panel" style={{ marginBottom: 18 }}>
              <div className="section-title">
                <div>
                  <h2>{data.name}</h2>
                  <p>
                    Participant ID <strong>{data.pid}</strong>
                    {data.hasIdCard ? " · ID card on file" : ""}
                  </p>
                </div>
                <span
                  className={`badge ${
                    data.verified === true || data.verified === 1 ? "ok" : "warn"
                  }`}
                >
                  {data.verified === true || data.verified === 1
                    ? "Verified"
                    : "Pending verification"}
                </span>
              </div>
            </section>
          ) : null}
          <div className="choice-grid">
            <div className="glass choice-card">
              <span className="badge pink">Details</span>
              <h3>Edit profile</h3>
              <p>
                Update name, college, ID card, and contact details used for ZEST
                verification.
              </p>
              <button className="btn btn-primary" onClick={() => setMode("edit")}>
                Edit profile
              </button>
            </div>
            <div className="glass choice-card">
              <span className="badge cyan">Security</span>
              <h3>Change password</h3>
              <p>Set a new password for your ZEST 2K26 account.</p>
              <button className="btn btn-gold" onClick={() => setMode("password")}>
                Change password
              </button>
            </div>
          </div>
        </>
      ) : null}

      {mode === "edit" ? (
        <form className="glass panel" onSubmit={handleSubmit}>
          <div className="section-title">
            <h2>{data ? "Edit profile" : "Create student profile"}</h2>
          </div>
          <div className="form-grid">
            <label className="field">
              Full name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label className="field">
              Student ID / Roll number
              <input name="rollno" value={form.rollno} onChange={handleChange} required />
            </label>
            <label className="field">
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                inputMode="numeric"
                required
                maxLength={10}
              />
            </label>
            <label className="field">
              Gender
              <select name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="field">
              Accommodation
              <select
                name="accomodation"
                value={form.accomodation}
                onChange={handleChange}
                required
              >
                <option value="">Select accommodation</option>
                <option value="Hosteller">Hosteller</option>
                <option value="Non Hosteller">Non Hosteller</option>
              </select>
            </label>
            <label className="field">
              Year
              <select name="year" value={form.year} onChange={handleChange} required>
                <option value="">Select year</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <label className="field full">
              College
              <input
                name="college"
                value={form.college}
                onChange={handleChange}
                required
                placeholder="SRMSCET for campus students"
              />
            </label>
            <label className="field">
              Branch
              <input name="branch" value={form.branch} onChange={handleChange} required />
            </label>
            <label className="field full">
              Address
              <input name="address" value={form.address} onChange={handleChange} required />
            </label>
            <label className="field full">
              Student ID card photo {!data ? "*" : ""}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setIdCard(event.target.files?.[0] || null)}
                required={!data}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : data ? "Save changes" : "Create profile"}
            </button>
            {data ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setMode("menu");
                  setError("");
                }}
              >
                Back
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {mode === "password" ? (
        <form className="glass panel" onSubmit={handlePassword}>
          <h2>Change password</h2>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <label className="field full">
              Current password
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              New password
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                required
                minLength={8}
              />
            </label>
            <label className="field">
              Confirm password
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-gold" disabled={saving}>
              {saving ? "Updating..." : "Update password"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setMode("menu");
                setError("");
              }}
            >
              Back
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
};

export default Profile;
