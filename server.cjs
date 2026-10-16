
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Use the model that previously worked for your project.
// You can override these in .env without changing this file.
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const MAX_ATTEMPTS = 3;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorDetails(data, response) {
  return {
    status: response.status,
    message:
      data?.error?.message ||
      data?.message ||
      `Gemini request failed with HTTP ${response.status}`,
    code: data?.error?.code || response.status,
    apiStatus: data?.error?.status || "",
  };
}

function isRetryable(status) {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

async function callGemini(model, image, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent`;

  const prompt = `
You are a waste identification assistant.

Analyze the provided image and return ONLY one valid JSON object.
Do not include markdown fences or extra text.

Use exactly these keys:
{
  "item": "short common name of the visible item",
  "material": "likely material, with uncertainty if needed",
  "category": "recyclable, reusable, biodegradable, hazardous, or unknown",
  "confidence": 0,
  "recommendation": "practical disposal or reuse advice",
  "reason": "brief explanation based on visible evidence"
}

Rules:
- confidence must be a number from 0 to 100.
- Do not claim certainty about material composition based only on appearance.
- Use "unknown" when the item cannot be identified reliably.
- Use "hazardous" only when the visible item reasonably suggests a potentially hazardous waste type.
- Do not infer that an item is recyclable in every location.
- A reusable item should be intact or plausibly suitable for reuse.
- Food scraps and suitable organic matter may be biodegradable.
- Keep the recommendation cautious and practical.
`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      lastError = {
        status: 503,
        message: `Could not connect to Gemini: ${error.message}`,
      };

      if (attempt < MAX_ATTEMPTS) {
        await sleep(1000 * attempt);
        continue;
      }

      throw lastError;
    }

    const raw = await response.text();
    let data;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }

    if (response.ok) {
      return data;
    }

    lastError = getErrorDetails(data, response);

    console.error(
      `Gemini model ${model}, attempt ${attempt}/${MAX_ATTEMPTS}:`,
      lastError
    );

    if (!isRetryable(response.status) || attempt === MAX_ATTEMPTS) {
      throw lastError;
    }

    // Backoff: 1 second, then 2 seconds.
    await sleep(1000 * 2 ** (attempt - 1));
  }

  throw lastError || {
    status: 500,
    message: "Gemini request failed unexpectedly.",
  };
}

function extractJson(data) {
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

  if (!text) {
    const reason = data?.promptFeedback?.blockReason;

    throw {
      status: 502,
      message: reason
        ? `Gemini blocked the request: ${reason}`
        : "Gemini returned no usable classification. Please try another image.",
    };
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw {
      status: 502,
      message: "Gemini returned invalid JSON. Please try again.",
    };
  }
}

function normalizeResult(result) {
  const validCategories = new Set([
    "recyclable",
    "reusable",
    "biodegradable",
    "hazardous",
    "unknown",
  ]);

  const item =
    typeof result.item === "string" && result.item.trim()
      ? result.item.trim().slice(0, 150)
      : "Unknown item";

  const material =
    typeof result.material === "string" && result.material.trim()
      ? result.material.trim().slice(0, 300)
      : "Not confidently identified";

  const rawCategory =
    typeof result.category === "string"
      ? result.category.toLowerCase().trim()
      : "unknown";

  const category = validCategories.has(rawCategory)
    ? rawCategory
    : "unknown";

  const confidence = Number(result.confidence);

  return {
    item,
    material,
    category,
    confidence: Number.isFinite(confidence)
      ? Math.max(0, Math.min(100, confidence))
      : 0,
    recommendation:
      typeof result.recommendation === "string"
        ? result.recommendation.trim().slice(0, 1000)
        : "Inspect the item and check local disposal guidance.",
    reason:
      typeof result.reason === "string"
        ? result.reason.trim().slice(0, 500)
        : "Review the item manually before disposal.",
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "EcoTwin AI classification API",
    model: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
  });
});

app.post("/api/classify", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Check your backend .env file.",
      });
    }

    const { image, mimeType } = req.body || {};

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Missing image. Upload an image and try again.",
      });
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({
        error: "Unsupported image type. Use JPG, PNG, or WEBP.",
      });
    }

    // Check approximate decoded size before sending it to Gemini.
    const estimatedBytes = Math.floor((image.length * 3) / 4);

    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return res.status(413).json({
        error: "Image is too large. Choose an image smaller than 7 MB.",
      });
    }

    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image)) {
      return res.status(400).json({
        error: "Image data is invalid. Please upload the image again.",
      });
    }

    let data;
    let usedModel = PRIMARY_MODEL;

    try {
      data = await callGemini(PRIMARY_MODEL, image, mimeType);
    } catch (primaryError) {
      const status = Number(primaryError.status);

      // Only try another model for temporary availability/quota errors.
      // Do not retry with a different model for invalid keys or bad requests.
      if (
        PRIMARY_MODEL === FALLBACK_MODEL ||
        ![429, 500, 502, 503, 504].includes(status)
      ) {
        throw primaryError;
      }

      console.warn(
        `Primary model ${PRIMARY_MODEL} failed (${status}); trying ${FALLBACK_MODEL}.`
      );

      usedModel = FALLBACK_MODEL;
      data = await callGemini(FALLBACK_MODEL, image, mimeType);
    }

    const result = normalizeResult(extractJson(data));

    console.log(
      `Image classified successfully using ${usedModel}: ${result.item} (${result.category})`
    );

    return res.json({
      ...result,
      model: usedModel,
    });
  } catch (error) {
    const status = Number(error?.status) || 500;
    const message =
      error?.message || "An unexpected classification error occurred.";

    console.error("Classification request failed:", {
      status,
      message,
      apiStatus: error?.apiStatus,
    });

    let userMessage = message;

    if (status === 503 || status === 502 || status >= 500) {
      userMessage =
        "Gemini is temporarily unavailable or returned an invalid response. Please try again shortly.";
    } else if (status === 429) {
      userMessage =
        "Gemini API quota or rate limit reached. Please wait and check your API quota.";
    } else if (status === 401 || status === 403) {
      userMessage =
        "Gemini rejected the API key or access to this model. Check your API key and model permissions.";
    } else if (status === 404) {
      userMessage =
        "The configured Gemini model was not found or is unavailable to this API key. Check GEMINI_MODEL in .env.";
    }

    return res.status(status >= 400 && status <= 599 ? status : 500).json({
      error: userMessage,
      code: error?.code || status,
      status: error?.apiStatus || "CLASSIFICATION_FAILED",
    });
  }
});

app.listen(PORT, () => {
  console.log(`EcoTwin AI backend running at http://localhost:${PORT}`);
  console.log(`Primary Gemini model: ${PRIMARY_MODEL}`);
  console.log(`Fallback Gemini model: ${FALLBACK_MODEL}`);
});
