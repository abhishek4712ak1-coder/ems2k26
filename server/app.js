import "dotenv/config";

import express from "express";
import mongoose from "mongoose";

import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan"
import connectDB from "./config/db.js";
import router from "./routes/auth.route.js";
import routerS from "./routes/user.route.js";
import eventRouter from "./routes/event.route.js";
import adminRouter from "./routes/admin.route.js";


const app = express();

app.set("trust proxy", 1);



app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:1800",
    "http://127.0.0.1:1800",
    process.env.CLIENT_ORIGIN,
    "https://ems2k26.onrender.com/",
  ].filter(Boolean)
);

const isAllowedOrigin = (origin) =>
  !origin ||
  allowedOrigins.has(origin) ||
  /^https:\/\/[a-z0-9-]+-5173\.app\.github\.dev$/i.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.log("CORS blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' });

app.use(morgan("combine",{stream:logStream}));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 15 minutes in milliseconds
  max: 500,  // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
});

app.use(limiter);


app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(cookieParser());


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});


//health
app.get("/health", (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    status: "OK",
    server: "running",
    database: databaseConnected
      ? "connected"
      : "disconnected",

    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});


app.use("/api/auth",router)
app.use("/api/student",routerS);
app.use("/api/events", eventRouter);
app.use("/api/admin", adminRouter);

const clientDist = path.join(__dirname, "../client/dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(clientDist, "index.html"));
    }

    return next();
  });
}

// Return a useful client error when the request body is not valid JSON instead
// of exposing the body-parser stack trace. Auth endpoints require a JSON object.
app.use((error, req, res, next) => {
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Request body must be a valid JSON object.",
    });
  }

  console.error("Unhandled error:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "Server error. Please try again later.",
  });
});

const PORT = process.env.PORT || 1800;

app.listen(PORT, async () => {
  await connectDB();
  console.log("App is running on PORT :", PORT);
});
