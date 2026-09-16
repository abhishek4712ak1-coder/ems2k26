import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import Events from "../models/event.model.js";
import Students from "../models/student.model.js";
import Individual from "../models/individual.model.js";
import Teams from "../models/team.model.js";

const studentFields = "-__v";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const studentPdfDirectory = path.join(__dirname, "../Zest-students");

const formatPdfValue = (value) => {
	if (value === undefined || value === null || value === "") return "Not provided";
	if (value instanceof Date) return value.toISOString();
	return String(value);
};

const formatPdfDate = (value) => {
	if (!value) return "Not provided";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return formatPdfValue(value);
	return date.toLocaleString("en-IN", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const saveStudentPdf = async (student) => {
	await fs.promises.mkdir(studentPdfDirectory, { recursive: true });

	const safePid = String(student.pid).replace(/[^a-zA-Z0-9_-]/g, "_");
	const filePath = path.join(studentPdfDirectory, `${safePid}.pdf`);
	const fieldPairs = [
		["Participant ID", student.pid],
		["Name", student.name],
		["Email", student.email],
		["Roll Number", student.rollno],
		["Gender", student.gender],
		["Accommodation", student.accomodation],
		["Phone", student.phone],
		["College", student.college],
		["Branch", student.branch],
		["Year", student.year],
		["Address", student.address],
		["ID Card File", student.idCardOriginalName || "Not provided"],
		["Verification Status", student.verified ? "Verified" : "Pending verification"],
		["Profile Created", formatPdfDate(student.createdAt)],
		["Profile Updated", formatPdfDate(student.updatedAt)],
	];

	await new Promise((resolve, reject) => {
		const document = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
		const stream = fs.createWriteStream(filePath);
		let settled = false;

		const handleError = (error) => {
			if (settled) return;
			settled = true;
			fs.promises.unlink(filePath).catch(() => {});
			reject(error);
		};

		stream.once("finish", () => {
			if (settled) return;
			settled = true;
			resolve();
		});
		stream.once("error", handleError);
		document.once("error", handleError);
		document.pipe(stream);

		const pageWidth = document.page.width - document.page.margins.left - document.page.margins.right;
		const accent = "#18b3a7";
		const dark = "#0f172a";
		const gold = "#d9b56d";
		const light = "#f8fafc";
		const border = "#dfe7ee";
		const text = "#1f2937";
		const muted = "#475569";

		document.fillColor(dark).rect(0, 0, document.page.width, 110).fill();
		document.fillColor(gold).rect(0, 110, document.page.width, 10).fill();
		document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("ZEST 2K26", 50, 32, { align: "left" });
		document.fillColor("#dbeafe").font("Helvetica").fontSize(9).text("STUDENT VERIFICATION RECORD", 50, 60, { align: "left" });

		const statusLabel = student.verified ? "VERIFIED" : "PENDING";
		const statusColor = student.verified ? "#166534" : "#92400e";
		const statusBg = student.verified ? "#dcfce7" : "#fef3c7";
		document
			.fillColor(statusBg)
			.roundedRect(document.page.width - 170, 26, 120, 28, 14)
			.fill();
		document
			.fillColor(statusColor)
			.font("Helvetica-Bold")
			.fontSize(9)
			.text(statusLabel, document.page.width - 150, 34, { width: 84, align: "center" });

		document.fillColor(light).roundedRect(45, 140, pageWidth, 220, 18).fill();
		document.strokeColor(border).lineWidth(1).roundedRect(45, 140, pageWidth, 220, 18).stroke();

		document.fillColor(accent).font("Helvetica-Bold").fontSize(12).text("PERSONAL DETAILS", 62, 156);
		document.fillColor(text).font("Helvetica-Bold").fontSize(22).text(formatPdfValue(student.name), 62, 182, { width: 300 });
		document.fillColor(muted).font("Helvetica").fontSize(10).text(`Participant ID: ${formatPdfValue(student.pid)} • Roll No: ${formatPdfValue(student.rollno)}`, 62, 210);

		const infoLeft = [
			["Email", student.email],
			["Phone", student.phone],
			["Gender", student.gender],
			["Accommodation", student.accomodation],
		];
		const infoRight = [
			["College", student.college],
			["Branch", student.branch],
			["Year", student.year],
			["Address", student.address],
		];

		let detailY = 246;
		const renderDetailBlock = (items, xPos) => {
			items.forEach(([label, value]) => {
				document.fillColor(muted).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), xPos, detailY, { width: 200 });
				document.fillColor(text).font("Helvetica").fontSize(10).text(formatPdfValue(value), xPos, detailY + 14, { width: 220, lineGap: 3 });
				detailY += 42;
			});
			detailY = 246;
		};

		renderDetailBlock(infoLeft, 62);
		renderDetailBlock(infoRight, 330);

		document.fillColor(light).roundedRect(45, 385, pageWidth, 194, 18).fill();
		document.strokeColor(border).lineWidth(1).roundedRect(45, 385, pageWidth, 194, 18).stroke();
		document.fillColor(accent).font("Helvetica-Bold").fontSize(12).text("VERIFICATION INFO", 62, 402);

		const verificationRows = [
			["ID Card File", student.idCardOriginalName || "Not provided"],
			["Verification Status", student.verified ? "Verified" : "Pending verification"],
			["Verified By", student.verifiedBy || "Not provided"],
			["Created On", formatPdfDate(student.createdAt)],
			["Updated On", formatPdfDate(student.updatedAt)],
		];

		let rowY = 430;
		verificationRows.forEach(([label, value]) => {
			document.fillColor(muted).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), 62, rowY, { width: 200 });
			document.fillColor(text).font("Helvetica").fontSize(10).text(formatPdfValue(value), 220, rowY, { width: 250, lineGap: 3 });
			rowY += 34;
		});

		document.fillColor(dark).font("Helvetica-Bold").fontSize(9).text("ZEST 2K26 • Student verification sheet", 50, 612, { align: "center" });
		document.end();
	});

	return filePath;
};

const escapeRegex = (value) =>
	String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEvent = (body = {}) => ({
	event: String(body.event || "").trim(),
	description: String(body.description || "").trim(),
	type: body.type === "Team" ? "Team" : "Individual",
	venue: String(body.venue || "").trim(),
	time: String(body.time || "").trim(),
	limit: Number.isFinite(Number(body.limit)) ? Number(body.limit) : 0,
	halt: Number(body.halt) === 1 ? 1 : 0,
});

const validateEvent = (event) => {
	if (!event.event) return "Event name is required.";
	if (event.limit < 0) return "Event limit cannot be negative.";
	return "";
};

export const getAdminOverview = async (req, res) => {
	const [students, events, individualRecords, teams] = await Promise.all([
		Students.countDocuments(),
		Events.countDocuments(),
		Individual.find({}, "email events").lean(),
		Teams.find({}, "event actual_members temp_members").lean(),
	]);

	const individualRegistrations = individualRecords.reduce(
		(total, item) => total + (item.events?.length || 0),
		0
	);
	const teamRegistrations = teams.reduce(
		(total, item) => total + (item.actual_members?.length || 0),
		0
	);

	res.json({
		data: {
			students,
			events,
			verified: await Students.countDocuments({ verified: 1 }),
			individualRegistrations,
			teamRegistrations,
		},
	});
};

export const listStudents = async (req, res) => {
	const search = String(req.query.search || "").trim();
	const query = search
		? {
				$or: [
					{ pid: { $regex: escapeRegex(search), $options: "i" } },
					{ name: { $regex: escapeRegex(search), $options: "i" } },
					{ rollno: { $regex: escapeRegex(search), $options: "i" } },
				],
			}
		: {};

	const students = await Students.find(query, studentFields)
		.sort({ createdAt: -1 })
		.limit(250)
		.lean();

	res.json({ data: students });
};

export const verifyStudent = async (req, res) => {
	const shouldVerify = !(req.body.verified === false || req.body.verified === 0);
	const verifiedBy = shouldVerify ? (req.email || req.user?.email || "Admin") : "";
	const student = await Students.findByIdAndUpdate(
		req.params.id,
		{ verified: shouldVerify ? 1 : 0, verifiedBy },
		{ new: true, projection: studentFields }
	).lean();

	if (!student) return res.status(404).json({ message: "Student not found." });
	if (shouldVerify) await saveStudentPdf(student);
	res.json({ message: student.verified ? "Student verified." : "Verification removed.", data: student });
};

export const listEvents = async (req, res) => {
	res.json({ data: await Events.find().sort({ type: 1, event: 1 }).lean() });
};

export const createEvent = async (req, res) => {
	const payload = normalizeEvent(req.body);
	const validationError = validateEvent(payload);
	if (validationError) return res.status(400).json({ message: validationError });

	try {
		const event = await Events.create(payload);
		res.status(201).json({ message: "Event created.", data: event });
	} catch (error) {
		if (error.code === 11000) return res.status(409).json({ message: "An event with that name already exists." });
		throw error;
	}
};

export const updateEvent = async (req, res) => {
	const payload = normalizeEvent(req.body);
	const validationError = validateEvent(payload);
	if (validationError) return res.status(400).json({ message: validationError });

	try {
		const event = await Events.findByIdAndUpdate(req.params.id, payload, {
			new: true,
			runValidators: true,
		}).lean();
		if (!event) return res.status(404).json({ message: "Event not found." });
		res.json({ message: "Event updated.", data: event });
	} catch (error) {
		if (error.code === 11000) return res.status(409).json({ message: "An event with that name already exists." });
		throw error;
	}
};

export const deleteEvent = async (req, res) => {
	const result = await Events.findByIdAndDelete(req.params.id);
	if (!result) return res.status(404).json({ message: "Event not found." });
	res.json({ message: "Event deleted." });
};

const studentMap = (students) => new Map(students.map((student) => [student.pid, student]));

export const getParticipationReport = async (req, res) => {
	const type = req.query.type === "Team" ? "Team" : req.query.type === "Individual" ? "Individual" : "All";
	const eventName = String(req.query.event || "").trim();
	const students = await Students.find({}, studentFields).lean();
	const byPid = studentMap(students);
	const byEmail = new Map(students.map((student) => [student.email, student]));
	const rows = [];

	if (type === "All" || type === "Individual") {
		const records = await Individual.find(eventName ? { events: eventName } : {}).lean();
		records.forEach((record) => {
			const student = byEmail.get(record.email);
			if (!student) return;
			const eventList = eventName ? record.events.filter((item) => item === eventName) : record.events;
			eventList.forEach((event) => rows.push({ kind: "Individual", event, student }));
		});
	}

	if (type === "All" || type === "Team") {
		const teams = await Teams.find(eventName ? { event: eventName } : {}).lean();
		teams.forEach((team) => {
			(team.actual_members || []).forEach((pid) => {
				const student = byPid.get(pid);
				if (student) rows.push({ kind: "Team", event: team.event, team: team.name, tid: team.tid, student });
			});
		});
	}

	res.json({ data: rows, total: rows.length });
};

export const getStudentReport = async (req, res) => {
	const value = String(req.params.value || "").trim();
	const student = await Students.findOne({
		$or: [
			{ _id: value.match(/^[a-f\d]{24}$/i) ? value : undefined },
			{ pid: value },
			{ rollno: value },
		].filter((item) => Object.values(item)[0] !== undefined),
	}, studentFields).lean();

	if (!student) return res.status(404).json({ message: "Student not found." });
	const [individual, teams] = await Promise.all([
		Individual.findOne({ email: student.email }).lean(),
		Teams.find({ actual_members: student.pid }).lean(),
	]);
	res.json({ data: { student, individualEvents: individual?.events || [], teams } });
};
