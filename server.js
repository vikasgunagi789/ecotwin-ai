
// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const { GoogleGenAI } = require("@google/genai");

// const app = express();
// const PORT = 3001;

// if (!process.env.GEMINI_API_KEY) {
//   throw new Error("Missing GEMINI_API_KEY in your .env file");
// }

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// app.use(cors({ origin: "http://localhost:5173" }));
// app.use(express.json({ limit: "12mb" }));

// app.get("/api/health", (req, res) => {
//   res.json({ ok: true, message: "EcoTwin AI backend is running" });
// });

// app.post("/api/classify", async (req, res) => {
//   try {
//     const { image, mimeType } = req.body || {};

//     if (
//       typeof image !== "string" ||
//       !["image/jpeg", "image/png", "image/webp"].includes(mimeType)
//     ) {
//       return res.status(400).json({
//         error: "Provide a JPEG, PNG, or WebP image.",
//       });
//     }

//     // Accept a base64 data URL or raw base64 image.
//     const base64 = image.includes(",") ? image.split(",")[1] : image;

//     if (!base64 || base64.length > 10_000_000) {
//       return res.status(400).json({ error: "Image is empty or too large." });
//     }

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: [
//         {
//           inlineData: {
//             mimeType,
//             data: base64,
//           },
//         },
//         {
//           text: `Analyze this waste item for an educational waste-sorting app.
// Return ONLY a valid JSON object with these fields:
// {
//   "item": "short name of the visible item",
//   "category": "recyclable | reusable | biodegradable | hazardous | unknown",
//   "material": "likely material",
//   "confidence": 0,
//   "reason": "brief explanation",
//   "recommendation": "practical disposal or reuse advice"
// }

// Rules:
// - confidence must be a number from 0 to 100 and represent your visual certainty.
// - Do not invent details that cannot be seen.
// - Use unknown if the image is unclear, the item cannot be identified,
//   or its material cannot be determined reliably.
// - Do not classify something as hazardous without visual evidence.
// - Consider local recycling rules may vary.
// - Output JSON only.`,
//         },
//       ],
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: "OBJECT",
//           properties: {
//             item: { type: "STRING" },
//             category: {
//               type: "STRING",
//               enum: [
//                 "recyclable",
//                 "reusable",
//                 "biodegradable",
//                 "hazardous",
//                 "unknown",
//               ],
//             },
//             material: { type: "STRING" },
//             confidence: { type: "NUMBER" },
//             reason: { type: "STRING" },
//             recommendation: { type: "STRING" },
//           },
//           required: [
//             "item",
//             "category",
//             "material",
//             "confidence",
//             "reason",
//             "recommendation",
//           ],
//         },
//       },
//     });

//     const result = JSON.parse(response.text);

//     // Avoid presenting uncertain predictions as confirmed.
//     if (result.confidence < 65) {
//       result.category = "unknown";
//       result.reason =
//         "The prediction is uncertain. Please review the item manually. " +
//         result.reason;
//     }

//     res.json(result);
//   } catch (error) {
//     console.error("Gemini classification failed:", error.message);
//     res.status(500).json({
//       error: "Image classification failed. Check the backend terminal.",
//     });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`EcoTwin AI backend running at http://localhost:${PORT}`);
// });
