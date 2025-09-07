import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import storyRoutes from "./routes/storyRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// // CORS configuration
// const corsOptions = {
//   origin: '*', // Allow all origins for development
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
//   exposedHeaders: ['Content-Length', 'Content-Type'],
//   optionsSuccessStatus: 200
// };

// CORS configuration
const corsOptions = {
  // 모든 Origin 허용 + credentials 대응: 요청 Origin을 그대로 반사
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  // allowedHeaders/exposedHeaders는 생략해서 요청의 헤더를 그대로 반사
};

// Apply CORS before any other middleware
// app.use(cors(corsOptions));
app.use(cors({ origin: "*" }));
// Express 5 호환 프리플라이트 처리 (와일드카드 대신 정규식)
app.options(/.*/, cors(corsOptions));

// Apply body parser middleware before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static file serving for uploaded files
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/story", storyRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
