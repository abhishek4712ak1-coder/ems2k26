import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import * as XLSX from "xlsx";
import {
  createAdminEvent,
  deleteAdminEvent,
  getAdminEvents,
  getAdminOverview,
  getAdminParticipation,
  getAdminStudentReport,
  getAdminStudents,
  updateAdminEvent,
  verifyAdminStudent,
} from "../../services/api.js";

const emptyEvent = { event: "", description: "", type: "Individual", venue: "", time: "", limit: 0, halt: 0 };
const printable = () => window.print();
const reportColumnOptions = [
  ["Name", "Student name"],
  ["PID", "Participant ID"],
  ["RollNumber", "Roll number"],
  ["Phone", "Phone"],
  ["Email", "Email"],
  ["Event", "Event"],
  ["RegistrationType", "Type"],
  ["Team", "Team name"],
  ["TeamID", "Team ID"],
  ["College", "College"],
  ["Branch", "Branch"],
];
const reportColumnDefaults = {
  All: reportColumnOptions.map(([key]) => key),
  Individual: ["Name", "PID", "RollNumber", "Phone", "Email", "Event", "College", "Branch"],
  Team: ["Name", "PID", "RollNumber", "Phone", "Email", "Event", "Team", "TeamID", "College", "Branch"],
};

const reportColumnLabel = (key) =>
  reportColumnOptions.find(([columnKey]) => columnKey === key)?.[1] || key;

const getReportValue = (row, key) => ({
  Name: row.student.name,
  PID: row.student.pid,
  RollNumber: row.student.rollno,
  Phone: row.student.phone,
  Email: row.student.email,
  Event: row.event,
  RegistrationType: row.kind,
  Team: row.team || "",
  TeamID: row.tid || "",
  College: row.student.college,
  Branch: row.student.branch,
}[key] || "");

const buildWorksheet = ({ title, subtitle, rows, filename, metadata = {} }) => {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const metaEntries = Object.entries(metadata);
  const table = [
    [title],
    [subtitle],
    [`Generated: ${new Date().toLocaleString()}`],
    ...metaEntries.map(([label, value]) => [`${label}: ${value || "All"}`]),
    [],
    columns,
    ...rows.map((row) => columns.map((column) => row[column] ?? "")),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(table);
  const metadataStartRow = 3;
  const headerRow = metadataStartRow + metaEntries.length + 2;
  const lastColumn = Math.max(columns.length - 1, 0);

  const richStyle = {
    font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 15 },
    fill: { fgColor: { rgb: "FF143B4A" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
  const subStyle = {
    font: { bold: true, color: { rgb: "FF0F172A" }, sz: 11 },
    fill: { fgColor: { rgb: "FFD8F36A" } },
    alignment: { horizontal: "left", vertical: "center" },
  };
  const metaStyle = {
    font: { color: { rgb: "FF1F2937" }, sz: 10 },
    fill: { fgColor: { rgb: "FFE8F4F1" } },
    alignment: { horizontal: "left", vertical: "center" },
  };
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 10 },
    fill: { fgColor: { rgb: "FF1B6E73" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FF0B1020" } },
      bottom: { style: "thin", color: { rgb: "FF0B1020" } },
      left: { style: "thin", color: { rgb: "FF0B1020" } },
      right: { style: "thin", color: { rgb: "FF0B1020" } },
    },
  };

  worksheet["A1"] = { v: title, s: richStyle };
  worksheet["A2"] = { v: subtitle, s: subStyle };
  worksheet["A3"] = { v: `Generated: ${new Date().toLocaleString()}`, s: metaStyle };

  metaEntries.forEach(([label, value], index) => {
    const cellRef = XLSX.utils.encode_cell({ r: metadataStartRow + index, c: 0 });
    worksheet[cellRef] = { v: `${label}: ${value || "All"}`, s: metaStyle };
  });

  const headerCellStart = headerRow;
  columns.forEach((column, columnIndex) => {
    const cellRef = XLSX.utils.encode_cell({ r: headerCellStart, c: columnIndex });
    worksheet[cellRef] = { v: column, s: headerStyle };
  });

  rows.forEach((row, rowIndex) => {
    columns.forEach((column, columnIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerCellStart + 1 + rowIndex, c: columnIndex });
      const value = row[column] ?? "";
      worksheet[cellRef] = {
        v: value,
        s: {
          font: { sz: 9 },
          fill: { fgColor: { rgb: rowIndex % 2 === 0 ? "FFFFFFFF" : "FFF9FAFB" } },
          border: {
            left: { style: "thin", color: { rgb: "FFE5E7EB" } },
            right: { style: "thin", color: { rgb: "FFE5E7EB" } },
            top: { style: "thin", color: { rgb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
          },
          alignment: { vertical: "center" },
        },
      };
    });
  });

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } },
  ];
  worksheet["!freeze"] = { xSplit: 0, ySplit: headerRow + 1 };
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRow, c: 0 },
      e: { r: headerRow + rows.length, c: lastColumn },
    }),
  };
  worksheet["!cols"] = columns.map((column) => ({
    wch: Math.min(
      34,
      Math.max(
        12,
        column.length + 3,
        ...rows.map((row) => String(row[column] ?? "").length + 3)
      )
    ),
  }));
  worksheet["!rows"] = [
    { hpt: 26 },
    { hpt: 20 },
    { hpt: 18 },
    ...metaEntries.map(() => ({ hpt: 18 })),
    { hpt: 8 },
    { hpt: 22 },
    ...rows.map(() => ({ hpt: 20 })),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participation");
  XLSX.writeFile(workbook, filename);
};

const AdminPanel = () => {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [rawReport, setRawReport] = useState([]);
  const [studentReport, setStudentReport] = useState(null);
  const [search, setSearch] = useState("");
  const [reportType, setReportType] = useState("All");
  const [reportEvent, setReportEvent] = useState("");
  const [reportLayout, setReportLayout] = useState("registration");
  const [editing, setEditing] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reportColumns, setReportColumns] = useState(
    reportColumnOptions.map(([key]) => key)
  );

  const run = async (callback) => {
    try {
      setBusy(true);
      setError("");
      await callback();
    } catch (err) {
      setError(err.message || "Unable to complete this admin action.");
    } finally {
      setBusy(false);
    }
  };

  const loadOverview = async () => setOverview((await getAdminOverview()).data);
  const loadStudents = async (term = search) => setStudents((await getAdminStudents(term)).data || []);
  const loadEvents = async () => setEvents((await getAdminEvents()).data || []);
  const loadReport = async () => setRawReport((await getAdminParticipation(reportType, reportEvent)).data || []);

  useEffect(() => {
    Promise.all([loadOverview(), loadStudents(""), loadEvents(), loadReport()])
      .catch((err) => setError(err.message || "Unable to load admin panel."))
      .finally(() => setLoading(false));
  }, []);

  const flash = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2800);
  };

  const handleStudentSearch = (event) => {
    event.preventDefault();
    run(() => loadStudents());
  };

  const toggleVerification = (student) => run(async () => {
    const response = await verifyAdminStudent(student._id, !student.verified);
    setStudents((current) => current.map((item) => item._id === student._id ? response.data : item));
    flash(response.message);
  });

  const saveEvent = (event) => run(async () => {
    event.preventDefault();
    const response = editing
      ? await updateAdminEvent(editing._id, eventForm)
      : await createAdminEvent(eventForm);
    setEvents((current) => editing
      ? current.map((item) => item._id === editing._id ? response.data : item)
      : [...current, response.data]);
    setEditing(null);
    setEventForm(emptyEvent);
    flash(response.message);
    await loadOverview();
  });

  const removeEvent = (event) => run(async () => {
    if (!window.confirm(`Delete ${event.event}?`)) return;
    const response = await deleteAdminEvent(event._id);
    setEvents((current) => current.filter((item) => item._id !== event._id));
    flash(response.message);
    await loadOverview();
  });

  const openStudentReport = (student) => run(async () => {
    const response = await getAdminStudentReport(student.pid);
    setStudentReport(response.data);
  });

  const changeReport = (field, value) => {
    const nextType = field === "type" ? value : reportType;
    const nextEvent = field === "event" ? value : reportEvent;
    if (field === "type") {
      setReportType(value);
      setReportColumns(reportColumnDefaults[value]);
    }
    else setReportEvent(value);
    run(async () => setRawReport((await getAdminParticipation(nextType, nextEvent)).data || []));
  };

  const exportStudents = () => buildWorksheet({
    title: "ZEST 2K26 Student Directory",
    subtitle: "Verified participant records",
    filename: "zest-2k26-students.xlsx",
    metadata: { PreparedBy: "ZEST 2K26 Admin" },
    rows: students.map((student) => ({
      Name: student.name,
      Email: student.email,
      PID: student.pid,
      RollNumber: student.rollno,
      College: student.college,
      Branch: student.branch,
      Year: student.year,
      Phone: student.phone,
      Verified: student.verified ? "Yes" : "No",
    })),
  });

  const exportEvents = () => buildWorksheet({
    title: "ZEST 2K26 Event Schedule",
    subtitle: "Admin-maintained event catalogue",
    filename: "zest-2k26-events.xlsx",
    metadata: { PreparedBy: "ZEST 2K26 Admin" },
    rows: events.map((event) => ({
    Event: event.event,
    Type: event.type,
    Description: event.description,
    Venue: event.venue,
    Time: event.time,
    Limit: event.limit,
    Status: Number(event.halt) === 1 ? "Halted" : "Open",
    })),
  });

  const studentWiseRows = Object.values(rawReport.reduce((groups, row) => {
    const key = row.student._id || row.student.pid;
    const current = groups[key] || {
      ...row,
      event: [],
      team: [],
      tid: [],
      kind: [],
    };
    current.event.push(row.event);
    if (row.team) current.team.push(row.team);
    if (row.tid) current.tid.push(row.tid);
    current.kind.push(row.kind);
    groups[key] = current;
    return groups;
  }, {})).map((row) => ({
    ...row,
    event: [...new Set(row.event)].join(" | "),
    team: [...new Set(row.team)].join(" | "),
    tid: [...new Set(row.tid)].join(" | "),
    kind: [...new Set(row.kind)].join(" / "),
  }));

  const report = reportLayout === "student" ? studentWiseRows : rawReport;
  const visibleReport = report;

  const selectedReportRows = visibleReport.map((row, index) =>
    Object.fromEntries([
      ["SNo", index + 1],
      ...reportColumns.map((key) => [reportColumnLabel(key), getReportValue(row, key)]),
    ])
  );

  const exportReport = () => buildWorksheet({
    title: "ZEST 2K26 Participation Register",
    subtitle: `${reportLayout === "student" ? "Student-wise" : "Registration-wise"} participation report`,
    filename: "zest-2k26-participation.xlsx",
    metadata: { Registration: reportType, Event: reportEvent, PreparedBy: "ZEST 2K26 Admin" },
    rows: selectedReportRows,
  });

  if (loading) return <div className="glass panel admin-loading">Loading admin command center...</div>;

  return (
    <>
      <Helmet><title>Admin | ZEST 2K26</title></Helmet>
      <div className="admin-header">
        <div>
          <div className="kicker">Admin Panel</div>
          <h1>Run the fest.</h1>
          <p>Verify the people, shape the schedule, and print the final lists.</p>
        </div>
          <div className="admin-header-actions no-print"><button className="btn btn-gold" type="button" onClick={printable}>Print / PDF</button><button className="btn btn-ghost" type="button" onClick={exportReport}>Export Excel</button></div>
      </div>

      {tab === "reports" ? <div className="report-layout-control no-print"><label htmlFor="report-layout">View grouped by</label><select id="report-layout" value={reportLayout} onChange={(event) => setReportLayout(event.target.value)}><option value="registration">Registration</option><option value="student">Student</option></select></div> : null}

      {message ? <div className="alert ok no-print">{message}</div> : null}
      {error ? <div className="alert err no-print">{error}</div> : null}

      <nav className="admin-tabs no-print" aria-label="Admin sections">
        {["overview", "students", "events", "reports"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} type="button" onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <section className="admin-dashboard">
          <div className="admin-stat-grid">
            {[["Students", overview?.students], ["Verified", overview?.verified], ["Events", overview?.events], ["Registrations", (overview?.individualRegistrations || 0) + (overview?.teamRegistrations || 0)]].map(([label, value]) => (
              <div className="glass admin-stat" key={label}><span>{label}</span><strong>{value || 0}</strong><small>Live database count</small></div>
            ))}
          </div>
          <div className="glass admin-welcome">
            <div><span className="admin-overline">Control room / 2K26</span><h2>Everything in one place.</h2><p>Search students instantly, keep event details current, and download clean participation sheets for coordinators.</p></div>
            <div className="admin-orbit">✦</div>
          </div>
        </section>
      ) : null}

      {tab === "students" ? (
        <section className="glass panel admin-section">
          <div className="section-title"><div><div className="kicker">Verification desk</div><h2>Student directory</h2><p>Search by name, participant ID, or roll number.</p></div><div className="admin-actions no-print"><button className="btn btn-ghost" type="button" onClick={printable}>Print / PDF</button><button className="btn btn-ghost" type="button" onClick={exportStudents}>Excel</button></div></div>
          <form className="admin-search no-print" onSubmit={handleStudentSearch}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, PID, or roll number" /><button className="btn btn-primary" disabled={busy}>Search</button></form>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>PID</th><th>Roll no.</th><th>College / branch</th><th>Status</th><th className="no-print">Actions</th></tr></thead><tbody>{students.map((student) => <tr key={student._id}><td><strong>{student.name}</strong><small>{student.email}</small></td><td>{student.pid}</td><td>{student.rollno}</td><td>{student.college}<small>{student.branch} · Year {student.year}</small></td><td><span className={`badge ${student.verified ? "ok" : "warn"}`}>{student.verified ? "Verified" : "Pending"}</span></td><td className="no-print"><button className="table-action" type="button" onClick={() => openStudentReport(student)}>View / print</button><button className="table-action" type="button" onClick={() => toggleVerification(student)}>{student.verified ? "Unverify" : "Verify"}</button></td></tr>)}</tbody></table>{students.length === 0 ? <div className="empty">No students match this search.</div> : null}</div>
        </section>
      ) : null}

      {tab === "events" ? (
        <section className="admin-section"><div className="admin-event-layout"><form className="glass panel admin-event-form no-print" onSubmit={saveEvent}><div className="kicker">Event editor</div><h2>{editing ? "Edit event" : "Add event"}</h2><label className="field">Event name<input required value={eventForm.event} onChange={(e) => setEventForm({ ...eventForm, event: e.target.value })} /></label><label className="field">Type<select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}><option>Individual</option><option>Team</option></select></label><label className="field">Description<textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></label><div className="form-grid"><label className="field">Venue<input value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} /></label><label className="field">Time<input value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} /></label><label className="field">Limit<input type="number" min="0" value={eventForm.limit} onChange={(e) => setEventForm({ ...eventForm, limit: e.target.value })} /></label><label className="field">Status<select value={eventForm.halt} onChange={(e) => setEventForm({ ...eventForm, halt: e.target.value })}><option value="0">Open</option><option value="1">Halted</option></select></label></div><div className="actions"><button className="btn btn-primary" disabled={busy}>{editing ? "Save changes" : "Create event"}</button>{editing ? <button className="btn btn-ghost" type="button" onClick={() => { setEditing(null); setEventForm(emptyEvent); }}>Cancel</button> : null}</div></form><div className="glass panel admin-event-list"><div className="section-title"><div><div className="kicker">Schedule board</div><h2>All events</h2></div><div className="admin-actions no-print"><button className="btn btn-ghost" type="button" onClick={printable}>Print / PDF</button><button className="btn btn-ghost" type="button" onClick={exportEvents}>Excel</button></div></div>{events.map((event) => <article className="admin-event-row" key={event._id}><div><span className={`badge ${event.type === "Team" ? "pink" : "cyan"}`}>{event.type}</span><h3>{event.event}</h3><p>{event.description || "No description added."}</p><small>{event.venue || "Venue TBA"} · {event.time || "Time TBA"} · Limit {event.limit || "—"}</small></div><div className="admin-event-actions no-print"><button className="table-action" type="button" onClick={() => { setEditing(event); setEventForm(event); }}>Edit</button><button className="table-action danger" type="button" onClick={() => removeEvent(event)}>Delete</button></div></article>)}</div></div></section>
      ) : null}

      {tab === "reports" ? <section className="glass panel admin-section"><div className="section-title"><div><div className="kicker">Print studio</div><h2>Participation lists</h2><p>Filter the register, choose Excel columns, and print a clean coordinator sheet.</p></div><div className="admin-actions no-print"><button className="btn btn-gold" type="button" onClick={printable}>Print / PDF</button><button className="btn btn-ghost" type="button" onClick={exportReport}>Excel selection</button></div></div><div className="admin-filters no-print"><select value={reportType} onChange={(e) => changeReport("type", e.target.value)}><option>All</option><option>Individual</option><option>Team</option></select><select value={reportEvent} onChange={(e) => changeReport("event", e.target.value)}><option value="">All events</option>{events.map((event) => <option value={event.event} key={event._id}>{event.event}</option>)}</select></div><div className="column-picker no-print"><strong>Excel columns</strong>{reportColumnOptions.map(([key, label]) => <label key={key}><input type="checkbox" checked={reportColumns.includes(key)} onChange={() => setReportColumns((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])} />{label}</label>)}</div><div className="report-heading"><span>ZEST 2K26 participation register</span><strong>{report.length} entries</strong></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>#</th><th>Student</th><th>PID / roll no.</th><th>Contact</th><th>Event</th><th>Registration</th><th>College</th></tr></thead><tbody>{report.map((row, index) => <tr key={`${row.kind}-${row.student._id}-${row.event}-${row.tid || index}`}><td>{index + 1}</td><td><strong>{row.student.name}</strong><small>{row.student.email}</small></td><td>{row.student.pid}<small>{row.student.rollno}</small></td><td>{row.student.phone}</td><td>{row.event}{row.team ? <small>{row.team} · {row.tid}</small> : null}</td><td><span className={`badge ${row.kind === "Team" ? "pink" : "cyan"}`}>{row.kind}</span></td><td>{row.student.college}<small>{row.student.branch}</small></td></tr>)}</tbody></table></div></section> : null}

      {tab === "reports" ? <section className="print-only-report"><div className="print-report-title">ZEST 2K26</div><h1>Participation Register</h1><p>Registration: {reportType} · Event: {reportEvent || "All events"}</p><p>Generated {new Date().toLocaleString()} · Prepared by ZEST 2K26 Admin</p><table><thead><tr><th>#</th>{reportColumns.map((key) => <th key={key}>{reportColumnLabel(key)}</th>)}</tr></thead><tbody>{report.map((row, index) => <tr key={`print-${row.kind}-${row.student._id}-${row.event}-${row.tid || index}`}><td>{index + 1}</td>{reportColumns.map((key) => <td key={key}>{getReportValue(row, key)}</td>)}</tr>)}</tbody></table></section> : null}

      {studentReport ? <div className="print-modal"><div className="glass panel student-sheet"><div className="no-print student-sheet-actions"><button className="btn btn-gold" type="button" onClick={printable}>Print / save PDF</button><button className="btn btn-ghost" type="button" onClick={() => setStudentReport(null)}>Close</button></div><div className="report-heading"><span>ZEST 2K26 student record</span><strong>{studentReport.student.verified ? "Verified" : "Pending verification"}</strong></div><h2>{studentReport.student.name}</h2><p className="student-sheet-subtitle">Participant ID: {studentReport.student.pid} · Roll number: {studentReport.student.rollno}</p><div className="student-detail-grid">{[["Email", studentReport.student.email], ["Phone", studentReport.student.phone], ["College", studentReport.student.college], ["Branch / year", `${studentReport.student.branch} / ${studentReport.student.year}`], ["Gender", studentReport.student.gender], ["Accommodation", studentReport.student.accomodation], ["Verified by", studentReport.student.verifiedBy || "Not assigned"], ["Address", studentReport.student.address]].map(([label, value]) => <div className="info-item" key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</div><h3>Registrations</h3><ul className="student-registration-list">{studentReport.individualEvents.map((event) => <li key={`i-${event}`}><span>{event}</span><b>Individual</b></li>)}{studentReport.teams.map((team) => <li key={team.tid}><span>{team.event} · {team.name}</span><b>Team · {team.tid}</b></li>)}</ul></div></div> : null}
    </>
  );
};

export default AdminPanel;
