
import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return callback(new Error("Upload a JPG, PNG, or WEBP image."));
    }

    callback(null, true);
  },
});

const categories = [
  "recyclable",
  "reusable",
  "biodegradable",
  "hazardous",
];

// Set XAI_MODEL in server/.env if your xAI account uses a different
// currently available vision model.
const XAI_MODEL = process.env.XAI_MODEL || "grok-2-vision-1212";

// Temporary in-memory Digital Twin; data resets when the server restarts.
const scans = [];

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    visionConfigured: Boolean(process.env.XAI_API_KEY),
    provider: "xAI",
    model: XAI_MODEL,
  });
});

app.post("/api/classify", upload.single("image"), async (req, res) => {
  try {
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "XAI_API_KEY is missing from server/.env.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an image.",
      });
    }

    const prompt = `
You are the waste-assessment assistant for EcoTwin AI.

Analyze the supplied image. Return one JSON object with exactly these fields:
{
  "category": "recyclable, reusable, biodegradable, or hazardous",
  "confidence": 0,
  "material": "short description",
  "recommendation": "practical next action",
  "steps": ["step 1", "step 2", "step 3"],
  "safety": "safety advice, or an empty string"
}

Choose exactly one category:
- recyclable: potentially recyclable paper, cardboard, glass, metal,
  or suitable plastic.
- reusable: an item that can reasonably be used again.
- biodegradable: food scraps, leaves, or other organic material.
- hazardous: batteries, chemicals, e-waste, sharps, or dangerous waste.

Confidence must be a number from 0 to 100. It is an estimate, not a
calibrated probability. If the image is unclear, state the uncertainty.
Do not assume a material can be recycled everywhere; local rules vary.
Never recommend opening batteries, mixing chemicals, burning waste,
or touching hazardous materials with bare hands.
Do not claim that an item is safe solely from its appearance.
Return JSON only.
`;

    const imageData = req.file.buffer.toString("base64");
    const imageUrl =
      `data:${req.file.mimetype};base64,${imageData}`;

    const response = await fetch(
      "https://api.x.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: XAI_MODEL,
          temperature: 0.2,
          max_tokens: 700,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      // Do not log the API key or the complete request.
      
const details = await response.text();

let apiMessage = "No additional details provided.";

try {
  const parsed = JSON.parse(details);
  apiMessage =
    parsed?.error?.message ||
    parsed?.message ||
    apiMessage;
} catch {
  if (details) apiMessage = details;
}

console.error("xAI API error:", response.status, apiMessage);

let friendlyMessage;

if (response.status === 401) {
  friendlyMessage = "xAI rejected the API key. Check XAI_API_KEY in server/.env.";
} else if (response.status === 403) {
  friendlyMessage = "xAI denied access. Check your account permissions and API access.";
} else if (response.status === 404) {
  friendlyMessage = "The configured xAI model or API endpoint was not found. Check XAI_MODEL.";
} else if (response.status === 429) {
  friendlyMessage = "xAI rate limit or API usage limit reached. Check your account usage.";
} else {
  friendlyMessage = `xAI returned HTTP ${response.status}: ${apiMessage.slice(0, 250)}`;
}

return res.status(502).json({ error: friendlyMessage });

    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw || typeof raw !== "string") {
      throw new Error("The AI returned an empty response.");
    }

    const result = JSON.parse(raw);
    const category = String(result.category || "").toLowerCase();

    if (!categories.includes(category)) {
      throw new Error("The AI returned an unsupported category.");
    }

    const confidence = Number(result.confidence);

    if (
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      throw new Error("The AI returned an invalid confidence estimate.");
    }

    const scan = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      confidence,
      material: String(result.material || "Uncertain material").slice(0, 200),
      recommendation: String(
        result.recommendation || "Check local disposal guidance."
      ).slice(0, 1000),
      steps: Array.isArray(result.steps)
        ? result.steps.slice(0, 6).map((step) => String(step).slice(0, 300))
        : [],
      safety: String(result.safety || "").slice(0, 1000),
      createdAt: new Date().toISOString(),
    };

    scans.unshift(scan);
    res.json(scan);
  } catch (error) {
    console.error("Classification failed:", error.message);

    res.status(502).json({
      error:
        "Image analysis failed. Check the server terminal and xAI model availability.",
    });
  }
});

app.get("/api/twin/summary", (_req, res) => {
  const byCategory = {
    recyclable: 0,
    reusable: 0,
    biodegradable: 0,
    hazardous: 0,
  };

  for (const scan of scans) {
    byCategory[scan.category] += 1;
  }

  res.json({
    totalScans: scans.length,
    byCategory,
    recentScans: scans.slice(0, 10),
    storage: "temporary",
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be 10 MB or smaller."
          : error.message,
    });
  }

  if (error.message?.startsWith("Upload a JPG")) {
    return res.status(415).json({ error: error.message });
  }

  console.error(error.message);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`EcoTwin API running at http://localhost:${PORT}`);
});
