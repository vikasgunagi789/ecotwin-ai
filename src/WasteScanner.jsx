import { useRef, useState } from "react";
import { addMaterial } from "./utils/materialTracker.js";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  ImagePlus,
  Leaf,
  LoaderCircle,
  RefreshCw,
  Recycle,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Save,
} from "lucide-react";

const API_URL = "http://localhost:3001/api/classify";
const MAX_IMAGE_SIZE = 7 * 1024 * 1024;
const MIN_CONFIDENCE = 65;

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const categories = [
  {
    id: "recyclable",
    label: "Recyclable",
    icon: Recycle,
    color: "#23794a",
    bg: "#e8f5eb",
    examples: "Paper, accepted plastics, glass and metals",
  },
  {
    id: "reusable",
    label: "Reusable",
    icon: RefreshCw,
    color: "#3974b9",
    bg: "#eaf2ff",
    examples: "Intact jars, containers and usable items",
  },
  {
    id: "biodegradable",
    label: "Biodegradable",
    icon: Leaf,
    color: "#a57525",
    bg: "#fff5df",
    examples: "Food scraps and suitable organic waste",
  },
  {
    id: "hazardous",
    label: "Hazardous",
    icon: AlertTriangle,
    color: "#b63f38",
    bg: "#fff0ed",
    examples: "Batteries, chemicals and electronic waste",
  },
  {
    id: "unknown",
    label: "Needs Review",
    icon: AlertTriangle,
    color: "#68756b",
    bg: "#f0f2f0",
    examples: "Unrecognized items requiring manual inspection",
  },
];

const recommendations = {
  recyclable: {
    recommendation:
      "Check the material and local acceptance rules. If accepted, empty and clean the item as appropriate before recycling.",
    steps: [
      "Check the material label",
      "Remove leftover contents",
      "Verify local recycling acceptance",
    ],
    safety:
      "This is a suggested category, not verified material identification.",
  },
  reusable: {
    recommendation:
      "Inspect the item for damage and contamination. If safe and suitable, reuse, repair or donate it before considering recycling.",
    steps: [
      "Inspect the item's condition",
      "Clean it if appropriate",
      "Reuse, repair or donate if suitable",
    ],
    safety:
      "Do not reuse containers that may have held hazardous chemicals.",
  },
  biodegradable: {
    recommendation:
      "If suitable as organic waste, use an accepted composting or organic-waste collection service. Keep contaminants out.",
    steps: [
      "Check the material",
      "Separate non-organic contaminants",
      "Use an appropriate composting stream",
    ],
    safety:
      "Not every item labeled biodegradable is suitable for home composting.",
  },
  hazardous: {
    recommendation:
      "Keep it separate from ordinary waste and follow local hazardous-waste collection guidance.",
    steps: [
      "Do not dismantle the item",
      "Avoid contact with leaking contents",
      "Find an authorized collection point",
    ],
    safety:
      "This is not a verified hazard assessment. Do not open, crush or mix potentially hazardous materials.",
  },
  unknown: {
    recommendation:
      "Inspect the item manually. Do not assume its material or disposal category from this prediction alone.",
    steps: [
      "Inspect the item and its label",
      "Check for damage or contamination",
      "Consult local disposal guidance",
    ],
    safety:
      "The model could not reliably identify this item. Its condition and safety have not been verified.",
  },
};

function getSafeCategory(category) {
  return categories.some((item) => item.id === category)
    ? category
    : "unknown";
}

async function imageToBase64(imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Could not read the selected image.");
  }

  const blob = await response.blob();

  if (!SUPPORTED_TYPES.includes(blob.type)) {
    throw new Error("Please upload a JPG, PNG, or WEBP image.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;

      if (typeof dataUrl !== "string" || !dataUrl.includes(",")) {
        reject(new Error("Could not convert the image."));
        return;
      }

      resolve({
        image: dataUrl.split(",")[1],
        mimeType: blob.type,
      });
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(blob);
  });
}

export default function WasteScanner() {
  const fileInput = useRef(null);

  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("");
  const [demoCategory, setDemoCategory] = useState("recyclable");
  const [savedKey, setSavedKey] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const selectedCategory = categories.find(
    (category) => category.id === result?.category
  );

  const scanKey = result
    ? `${image}|${mode}|${result.modelLabel || result.material}|${result.category}`
    : "";

  const alreadySaved = Boolean(scanKey) && scanKey === savedKey;

  function handleFile(file) {
    if (!file) return;

    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Please choose an image smaller than 7 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    if (image) {
      URL.revokeObjectURL(image);
    }

    const previewUrl = URL.createObjectURL(file);

    setImage(previewUrl);
    setFileName(file.name);
    setResult(null);
    setError("");
    setStatus("idle");
    setMode("");
    setSavedKey("");
    setSaveMessage("");
    setSaveError("");
  }

  function clearImage() {
    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage(null);
    setFileName("");
    setResult(null);
    setError("");
    setStatus("idle");
    setMode("");
    setSavedKey("");
    setSaveMessage("");
    setSaveError("");

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  async function runAI() {
    if (!image) {
      setError("Please upload a waste image first.");
      return;
    }

    setStatus("loading");
    setError("");
    setResult(null);
    setMode("");
    setSaveMessage("");
    setSaveError("");

    try {
      const { image: base64Image, mimeType } =
        await imageToBase64(image);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The backend returned an invalid response. Check the server terminal."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Gemini could not classify this image."
        );
      }

      const validCategories = [
        "recyclable",
        "reusable",
        "biodegradable",
        "hazardous",
        "unknown",
      ];

      const category = validCategories.includes(data.category)
        ? data.category
        : "unknown";

      const confidence = Number(data.confidence);

      const safeConfidence = Number.isFinite(confidence)
        ? Math.max(0, Math.min(100, confidence))
        : 0;

      const finalCategory =
        safeConfidence < MIN_CONFIDENCE
          ? "unknown"
          : category;

      const advice = recommendations[finalCategory];
      const itemName =
        typeof data.item === "string" && data.item.trim()
          ? data.item.trim()
          : "Unknown item";

      const detectedMaterial =
        typeof data.material === "string" && data.material.trim()
          ? data.material.trim()
          : "Not confidently identified";

      const aiRecommendation =
        typeof data.recommendation === "string" &&
        data.recommendation.trim()
          ? data.recommendation.trim()
          : advice.recommendation;

      setResult({
        ...advice,
        category: finalCategory,
        material: itemName,
        modelLabel: itemName,
        detectedMaterial,
        recommendation: aiRecommendation,
        confidence: safeConfidence,
        classificationReason:
          typeof data.reason === "string" && data.reason.trim()
            ? data.reason.trim()
            : "Review the result before disposal.",
      });

      setMode("gemini");
      setStatus("done");
    } catch (err) {
      console.error("Gemini waste classification failed:", err);

      const message =
        err instanceof TypeError
          ? "Cannot connect to the backend. Make sure server.cjs is running on port 3001."
          : err?.message || "An unexpected error occurred.";

      setError(`Could not analyze this image. ${message}`);
      setStatus("idle");
    }
  }

  function runDemo() {
    if (!image) {
      setError("Upload an image before previewing the demo.");
      return;
    }

    const category = getSafeCategory(demoCategory);

    setResult({
      ...recommendations[category],
      category,
      material: `Demo: ${category}`,
      modelLabel: `Demo: ${category}`,
      confidence: null,
      classificationReason:
        "This is a demonstration scenario, not an AI prediction.",
      detectedMaterial: "Not analyzed",
    });

    setMode("demo");
    setStatus("done");
    setError("");
    setSaveMessage("");
    setSaveError("");
  }

  
function saveScan() {
  if (!result || !selectedCategory || !scanKey) {
    setSaveError("Run a scan or preview a demo before saving.");
    return;
  }

  if (alreadySaved) {
    setSaveMessage("This result has already been saved.");
    return;
  }

  try {
    addMaterial({
      name: result.modelLabel || result.material || "Unknown material",
      category: result.category || "unknown",
      material: result.detectedMaterial || "",
      recommendation: result.recommendation || "",
      confidence:
        result.confidence == null
          ? null
          : Number(result.confidence),
      status: "Pending",
      weightKg: 0,
      scanMode: mode,
    });

    setSavedKey(scanKey);
    setSaveMessage(
      "Saved successfully! Open Material Tracking to manage this record."
    );
    setSaveError("");
  } catch (err) {
    console.error("Could not save scan:", err);
    setSaveError(
      "Could not save this scan. Check browser storage and try again."
    );
    setSaveMessage("");
  }
}


  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] text-[#278354]">
          <Sparkles size={14} />
          Computer vision workspace
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#193b2a] sm:text-3xl">
          AI Waste Scanner
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#78877d]">
          Upload an item, inspect its classification and discover a safer,
          more circular next step.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#254330]">
                Upload waste image
              </h2>
              <p className="mt-1 text-xs text-[#96a298]">
                JPG, PNG or WEBP · Maximum 7 MB
              </p>
            </div>

            <div className="rounded-xl bg-[#eaf5ed] p-3 text-[#23794a]">
              <Cpu size={22} />
            </div>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) =>
              handleFile(event.target.files?.[0])
            }
          />

          {!image ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-6 flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d8e6d9] bg-[#f8fbf8] px-5 text-center transition hover:border-[#58a777] hover:bg-[#f0f8f1]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#298354] shadow-sm">
                <ImagePlus size={30} />
              </div>

              <span className="mt-5 text-sm font-extrabold text-[#355441]">
                Click to upload a waste image
              </span>

              <span className="mt-2 max-w-xs text-xs leading-5 text-[#91a095]">
                Choose a clear photo with the item visible. Avoid including
                people or sensitive information.
              </span>

              <span className="mt-5 flex items-center gap-2 rounded-xl bg-[#176b48] px-4 py-3 text-xs font-bold text-white">
                <Upload size={15} />
                Choose image
              </span>
            </button>
          ) : (
            <div className="mt-6">
              <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-[#f3f6f3] p-3">
                <img
                  src={image}
                  alt="Selected waste item preview"
                  className="max-h-[420px] w-full rounded-xl object-contain"
                />

                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove selected image"
                  className="absolute right-4 top-4 rounded-xl border border-[#e5ece5] bg-white p-2 text-[#53685a] shadow-sm"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f6f9f6] p-3">
                <div className="rounded-lg bg-white p-2 text-[#35845a]">
                  <ImagePlus size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#3c5644]">
                    {fileName}
                  </p>
                  <p className="mt-1 text-[10px] text-[#96a298]">
                    Image ready for analysis
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="text-xs font-bold text-[#278354]"
                >
                  Replace
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 flex gap-2 rounded-xl border border-[#f1d5cd] bg-[#fff6f3] p-3 text-xs leading-5 text-[#9d4137]"
            >
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={runAI}
            disabled={!image || status === "loading"}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#176b48] px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#105638] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Analyze with AI
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="mt-3 text-center text-[10px] leading-5 text-[#98a49a]">
            Gemini analyzes the uploaded image and suggests a waste category.
            Predictions can be incorrect; verify material composition, local
            recycling rules, and any safety concerns before disposal.
          </p>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-extrabold text-[#254330]">
              Classification categories
            </h2>

            <p className="mt-1 text-[11px] leading-5 text-[#96a298]">
              Suggested disposal pathways, not verified material assessments.
            </p>

            <div className="mt-5 space-y-3">
              {categories.map(
                ({ id, label, icon: Icon, color, bg, examples }) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-xl border border-[#edf1ed] p-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: bg, color }}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#3d5745]">
                        {label}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-[#8d9a90]">
                        {examples}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#dcebdd] bg-[#edf7ef] p-5">
            <div className="flex items-center gap-2 text-[#247748]">
              <ShieldCheck size={20} />
              <h2 className="text-sm font-extrabold">Safety-first AI</h2>
            </div>

            <p className="mt-3 text-xs leading-6 text-[#617a67]">
              Uncertain or potentially hazardous items require conservative
              guidance. A model prediction is not proof of material
              composition, food safety, or local recyclability.
            </p>
          </section>
        </div>
      </div>

      {result && selectedCategory && (
        <section className="overflow-hidden rounded-2xl border border-[#dce8dc] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ed] p-5 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={19} className="text-[#288454]" />
                <h2 className="text-base font-extrabold text-[#254330]">
                  Scan result
                </h2>
              </div>

              <p className="mt-1 text-[11px] text-[#96a298]">
                {mode === "gemini"
                  ? "Gemini vision AI · Suggested category; verify before disposal"
                  : "Illustrative workflow · Not an AI prediction"}
              </p>
            </div>

            <span
              className="rounded-lg px-3 py-2 text-xs font-bold"
              style={{
                color: selectedCategory.color,
                background: selectedCategory.bg,
              }}
            >
              {selectedCategory.label}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#92a096]">
                Material assessment
              </p>

              <h3 className="mt-2 text-xl font-extrabold text-[#244330]">
                {result.material}
              </h3>

              {mode === "gemini" && result.classificationReason && (
                <p className="mt-2 text-xs leading-5 text-[#78877d]">
                  {result.classificationReason}
                </p>
              )}

              {mode === "gemini" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-[#708276]">
                      AI-reported confidence
                    </span>

                    <span className="font-extrabold text-[#267c4d]">
                      {result.confidence.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf2ed]">
                    <div
                      className="h-full rounded-full bg-[#399565]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, result.confidence)
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-[#98a49a]">
                    This confidence is reported by the AI and is not a
                    calibrated probability of correctness. It does not
                    guarantee material identification or a safe disposal
                    decision.
                  </p>

                  <div className="mt-3 rounded-xl border border-[#edf1ed] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#829086]">
                      Suggested material
                    </p>
                    <p className="mt-2 text-xs text-[#526b59]">
                      {result.detectedMaterial}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-[#f5f9f5] p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#2e6542]">
                  <Leaf size={16} />
                  Recommended next action
                </div>

                <p className="mt-2 text-xs leading-6 text-[#637768]">
                  {result.recommendation}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-[#355441]">
                Your next steps
              </h3>

              <div className="mt-4 space-y-3">
                {result.steps.map((step, index) => (
                  <div
                    key={`${step}-${index}`}
                    className="flex gap-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf5ed] text-[11px] font-extrabold text-[#278354]">
                      {index + 1}
                    </div>

                    <p className="pt-1 text-xs leading-5 text-[#708276]">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2 rounded-xl border border-[#f0dfb7] bg-[#fff9e9] p-3">
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0 text-[#a57525]"
                />
                <p className="text-[11px] leading-5 text-[#876d3e]">
                  {result.safety}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#edf1ed] p-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveScan}
                disabled={alreadySaved}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#176b48] px-5 py-3 text-xs font-extrabold text-white transition hover:bg-[#105638] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {alreadySaved ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <Save size={17} />
                )}

                {alreadySaved
                  ? "Saved to Material Tracking"
                  : "Save to Material Tracking"}
              </button>

              {alreadySaved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#278354]">
                  <CheckCircle2 size={15} />
                  Record saved
                </span>
              )}
            </div>

            {saveMessage && (
              <p role="status" className="mt-3 text-xs text-[#278354]">
                {saveMessage}
              </p>
            )}

            {saveError && (
              <p role="alert" className="mt-3 text-xs text-[#b63f38]">
                {saveError}
              </p>
            )}

            <p className="mt-3 text-[10px] leading-5 text-[#98a49a]">
              The record is stored in this browser. Weight is set to 0 kg
              because the scanner cannot measure an item's weight.
            </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#eaf5ed] p-3 text-[#278354]">
            <Sparkles size={20} />
          </div>

          <div className="flex-1">
            <h2 className="text-sm font-extrabold text-[#254330]">
              Preview the complete workflow
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#89968c]">
              Choose a sample recommendation. This does not classify your
              uploaded image.
            </p>

            <label
              htmlFor="demo-category"
              className="mt-4 block text-xs font-bold text-[#526b59]"
            >
              Select a demo scenario
            </label>

            <select
              id="demo-category"
              value={demoCategory}
              onChange={(event) => setDemoCategory(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-3 text-xs text-[#385442] outline-none focus:border-[#58a777]"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={runDemo}
              disabled={!image || status === "loading"}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfe2d1] px-4 py-3 text-xs font-extrabold text-[#26764a] transition hover:bg-[#f1f8f2] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Preview demo recommendation
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
