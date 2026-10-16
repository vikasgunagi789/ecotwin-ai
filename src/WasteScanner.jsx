import { useRef, useState } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import { addMaterial } from "./utils/materialTracker.js";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Cpu, ImagePlus, Leaf,
  LoaderCircle, RefreshCw, Recycle, ShieldCheck, Sparkles, Upload, X, Save,
} from "lucide-react";

let modelPromise;
async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }
      await tf.ready();
      if (!tf.getBackend()) throw new Error("TensorFlow.js could not start.");
      return mobilenet.load();
    })().catch((error) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

const categories = [
  { id: "recyclable", label: "Recyclable", icon: Recycle, color: "#23794a", bg: "#e8f5eb", examples: "Paper, accepted plastics, glass and metals" },
  { id: "reusable", label: "Reusable", icon: RefreshCw, color: "#3974b9", bg: "#eaf2ff", examples: "Intact jars, containers and usable items" },
  { id: "biodegradable", label: "Biodegradable", icon: Leaf, color: "#a57525", bg: "#fff5df", examples: "Food scraps and suitable organic waste" },
  { id: "hazardous", label: "Hazardous", icon: AlertTriangle, color: "#b63f38", bg: "#fff0ed", examples: "Batteries, chemicals and electronic waste" },
  { id: "unknown", label: "Needs Review", icon: AlertTriangle, color: "#68756b", bg: "#f0f2f0", examples: "Unrecognized items requiring manual inspection" },
];

const recommendations = {
  recyclable: {
    material: "Possible recyclable material",
    recommendation: "Check the material and local acceptance rules. If accepted, empty and clean the item as appropriate before recycling.",
    steps: ["Check the material label", "Remove leftover contents", "Verify local recycling acceptance"],
    safety: "This is a suggested category, not verified material identification.",
  },
  reusable: {
    material: "Potentially reusable item",
    recommendation: "Inspect the item for damage and contamination. If safe and suitable, reuse, repair or donate it before considering recycling.",
    steps: ["Inspect condition", "Clean if appropriate", "Reuse, repair or donate if suitable"],
    safety: "Do not reuse containers that may have held hazardous chemicals.",
  },
  biodegradable: {
    material: "Possible organic waste",
    recommendation: "If suitable as organic waste, use an accepted composting or organic-waste collection service. Keep contaminants out.",
    steps: ["Check the material", "Separate non-organic contaminants", "Use an appropriate composting stream"],
    safety: "Not every item labeled biodegradable is suitable for home composting.",
  },
  hazardous: {
    material: "Potentially hazardous waste",
    recommendation: "Keep it separate from ordinary waste and follow local hazardous-waste collection guidance.",
    steps: ["Do not dismantle it", "Avoid contact with leaking contents", "Find an authorized collection point"],
    safety: "This is not a verified hazard assessment. Do not open, crush or mix potentially hazardous materials.",
  },
  unknown: {
    material: "Material could not be confidently identified",
    recommendation: "Inspect the item manually. Do not assume its material or disposal category from this prediction alone.",
    steps: ["Inspect the item and its label", "Check for damage or contamination", "Consult local disposal guidance"],
    safety: "The model could not reliably identify this item. Its condition and safety have not been verified.",
  },
};

const rules = [
  { category: "hazardous", pattern: /\b(battery|syringe|pesticide|insecticide|chemical|toxic waste)\b/i },
  { category: "biodegradable", pattern: /\b(apple|granny smith|banana|orange|lemon|lime|pear|peach|plum|strawberry|blueberry|pineapple|pomegranate|fig|cucumber|broccoli|cauliflower|cabbage|spinach|vegetable|fruit|food|mushroom)\b/i },
  { category: "recyclable", pattern: /\b(plastic bottle|water bottle|beer bottle|can|tin can|carton|cardboard|newspaper|paper|glass bottle|jar|aluminum foil)\b/i },
];


const MIN_CONFIDENCE = 0.65;

function classify(predictions) {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return {
      category: "unknown",
      prediction: null,
      reason: "No recognizable object was detected.",
    };
  }

  // Use only the top prediction. Do not search lower-ranked labels
  // for keywords and accidentally classify an unrelated object.
  const prediction = predictions[0];
  const label = prediction.className
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();

  // A low object-label score is not sufficient for categorization.
  if (prediction.probability < MIN_CONFIDENCE) {
    return {
      category: "unknown",
      prediction,
      reason: "The model is not confident enough to suggest a category.",
    };
  }

  // Conservative mappings for recognizable objects only.
  // These rules are NOT a substitute for a waste-specific AI model.
  const mappings = [
    {
      category: "biodegradable",
      pattern: /^(granny smith|banana|orange|lemon|fig|pomegranate|strawberry|pineapple|acorn squash|butternut squash)$/,
    },
    {
      category: "recyclable",
      pattern: /^(beer bottle|pop bottle|water bottle|wine bottle|pill bottle|milk can|tin can|soda can|pop can|carton|paper towel|toilet tissue|newspaper|envelope|comic book|cardboard|can opener)$/,
    },
    {
      category: "reusable",
      pattern: /^(mason jar|coffee mug|cup|plate|bowl|pitcher|vase)$/,
    },
  ];

  const match = mappings.find((item) => item.pattern.test(label));

  if (!match) {
    return {
      category: "unknown",
      prediction,
      reason:
        "The detected object does not have a reliable waste-category mapping.",
    };
  }

  return {
    category: match.category,
    prediction,
    reason: "Suggested category based on the detected object; verify manually.",
  };
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

  const selectedCategory = categories.find((c) => c.id === result?.category);
  const scanKey = result ? `${image}|${mode}|${result.modelLabel || result.material}|${result.category}` : "";
  const alreadySaved = Boolean(scanKey) && scanKey === savedKey;

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select an image file.");
    if (file.size > 10 * 1024 * 1024) return setError("Please choose an image smaller than 10 MB.");
    setImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    setResult(null); setError(""); setStatus("idle"); setMode("");
    setSavedKey(""); setSaveMessage(""); setSaveError("");
  }

  function clearImage() {
    if (image) URL.revokeObjectURL(image);
    setImage(null); setFileName(""); setResult(null); setError("");
    setStatus("idle"); setMode(""); setSavedKey(""); setSaveMessage(""); setSaveError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function runAI() {
    if (!image) return setError("Please upload a waste image first.");
    setStatus("loading"); setError(""); setResult(null); setMode("");
    setSaveMessage(""); setSaveError("");
    try {
      const model = await getModel();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("The uploaded image could not be loaded."));
        img.src = image;
      });
      const predictions = await model.classify(img, 5);
      if (!predictions?.length) throw new Error("No recognizable object was found.");
      
const { category, prediction, reason } = classify(predictions);

setResult({
  ...recommendations[category],
  category,
  material: prediction
    ? category === "unknown"
      ? `Needs review: ${prediction.className}`
      : `Possible item: ${prediction.className}`
    : "Needs review: no recognizable object",
  confidence: prediction ? prediction.probability * 100 : 0,
  modelLabel: prediction?.className || "Unknown item",
  predictions,
  classificationReason: reason,
});

      setMode("local"); setStatus("done");
    } catch (err) {
      console.error("Local waste classification failed:", err);
      setError(`Could not analyze this image. ${err?.message || "Please try another clear photo."}`);
      setStatus("idle");
    }
  }

  function runDemo() {
    if (!image) return setError("Upload an image before previewing the demo.");
    setResult({ ...recommendations[demoCategory], category: demoCategory, confidence: null, modelLabel: `Demo: ${demoCategory}` });
    setMode("demo"); setStatus("done"); setError(""); setSaveMessage(""); setSaveError("");
  }

  function saveScan() {
    if (!result || !selectedCategory || !scanKey) return setSaveError("Run a scan or preview a demo before saving.");
    if (alreadySaved) return setSaveMessage("This result has already been saved.");
    try {
      addMaterial({
        name: result.modelLabel || result.material || "Unknown material",
        category: selectedCategory.label,
        recommendation: result.recommendation,
        weightKg: 0,
      });
      setSavedKey(scanKey);
      setSaveMessage("Saved successfully! Open Material Tracking to manage this record.");
      setSaveError("");
    } catch (err) {
      console.error("Could not save scan:", err);
      setSaveError("Could not save this scan. Check browser storage and try again.");
      setSaveMessage("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] text-[#278354]"><Sparkles size={14} /> Computer vision workspace</div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#193b2a] sm:text-3xl">AI Waste Scanner</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#78877d]">Upload an item, inspect its classification and discover a safer, more circular next step.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-base font-extrabold text-[#254330]">Upload waste image</h2><p className="mt-1 text-xs text-[#96a298]">JPG, PNG or WEBP · Maximum 10 MB</p></div>
            <div className="rounded-xl bg-[#eaf5ed] p-3 text-[#23794a]"><Cpu size={22} /></div>
          </div>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          {!image ? (
            <button type="button" onClick={() => fileInput.current?.click()} className="mt-6 flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d8e6d9] bg-[#f8fbf8] px-5 text-center transition hover:border-[#58a777] hover:bg-[#f0f8f1]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#298354] shadow-sm"><ImagePlus size={30} /></div>
              <span className="mt-5 text-sm font-extrabold text-[#355441]">Click to upload a waste image</span>
              <span className="mt-2 max-w-xs text-xs leading-5 text-[#91a095]">Choose a clear photo with the item visible. Avoid including people or sensitive information.</span>
              <span className="mt-5 flex items-center gap-2 rounded-xl bg-[#176b48] px-4 py-3 text-xs font-bold text-white"><Upload size={15} /> Choose image</span>
            </button>
          ) : (
            <div className="mt-6">
              <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-[#f3f6f3] p-3">
                <img src={image} alt="Selected item preview" className="max-h-[420px] w-full rounded-xl object-contain" />
                <button type="button" onClick={clearImage} aria-label="Remove selected image" className="absolute right-4 top-4 rounded-xl border border-[#e5ece5] bg-white p-2 text-[#53685a] shadow-sm"><X size={17} /></button>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f6f9f6] p-3">
                <div className="rounded-lg bg-white p-2 text-[#35845a]"><ImagePlus size={18} /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#3c5644]">{fileName}</p><p className="mt-1 text-[10px] text-[#96a298]">Image ready for analysis</p></div>
                <button type="button" onClick={() => fileInput.current?.click()} className="text-xs font-bold text-[#278354]">Replace</button>
              </div>
            </div>
          )}
          {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-[#f1d5cd] bg-[#fff6f3] p-3 text-xs leading-5 text-[#9d4137]"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
          <button type="button" onClick={runAI} disabled={!image || status === "loading"} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#176b48] px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#105638] disabled:cursor-not-allowed disabled:opacity-50">
            {status === "loading" ? <><LoaderCircle size={18} className="animate-spin" /> Loading browser model...</> : <><Sparkles size={17} /> Analyze with AI <ArrowRight size={17} /></>}
          </button>
          <p className="mt-3 text-center text-[10px] leading-5 text-[#98a49a]">MobileNet recognizes common objects but is not a waste-specific or fruit-condition model. It cannot reliably detect spoilage, verify material composition, or rule out hazards.</p>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-extrabold text-[#254330]">Classification categories</h2>
            <p className="mt-1 text-[11px] leading-5 text-[#96a298]">Suggested disposal pathways, not verified material assessments.</p>
            <div className="mt-5 space-y-3">
              {categories.map(({ id, label, icon: Icon, color, bg, examples }) => <div key={id} className="flex items-center gap-3 rounded-xl border border-[#edf1ed] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: bg, color }}><Icon size={19} /></div>
                <div className="min-w-0"><p className="text-xs font-bold text-[#3d5745]">{label}</p><p className="mt-1 text-[10px] leading-4 text-[#8d9a90]">{examples}</p></div>
              </div>)}
            </div>
          </section>
          <section className="rounded-2xl border border-[#dcebdd] bg-[#edf7ef] p-5">
            <div className="flex items-center gap-2 text-[#247748]"><ShieldCheck size={20} /><h2 className="text-sm font-extrabold">Safety-first AI</h2></div>
            <p className="mt-3 text-xs leading-6 text-[#617a67]">Uncertain or potentially hazardous items require conservative guidance. A model prediction is not proof of material composition, food safety, or local recyclability.</p>
          </section>
        </div>
      </div>

      {result && selectedCategory && <section className="overflow-hidden rounded-2xl border border-[#dce8dc] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ed] p-5 sm:px-6">
          <div><div className="flex items-center gap-2"><CheckCircle2 size={19} className="text-[#288454]" /><h2 className="text-base font-extrabold text-[#254330]">Scan result</h2></div><p className="mt-1 text-[11px] text-[#96a298]">{mode === "local" ? "Browser image model · Suggested category only" : "Illustrative workflow · Not an AI prediction"}</p></div>
          <span className="rounded-lg px-3 py-2 text-xs font-bold" style={{ color: selectedCategory.color, background: selectedCategory.bg }}>{selectedCategory.label}</span>
        </div>
        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#92a096]">Material assessment</p>
            <h3 className="mt-2 text-xl font-extrabold text-[#244330]">{result.material}</h3>
            {mode === "local" && result.classificationReason && (
  <p className="mt-2 text-xs leading-5 text-[#78877d]">
    {result.classificationReason}
  </p>
)}
            {mode === "local" && <div className="mt-4">
              <div className="flex items-center justify-between text-xs"><span className="font-semibold text-[#708276]">Model confidence</span><span className="font-extrabold text-[#267c4d]">{result.confidence.toFixed(1)}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf2ed]"><div className="h-full rounded-full bg-[#399565]" style={{ width: `${Math.min(100, Math.max(0, result.confidence))}%` }} /></div>
              <p className="mt-2 text-[10px] leading-5 text-[#98a49a]">This score belongs to the model's selected label. It does not guarantee a correct material, condition, or disposal decision.</p>
              {result.predictions?.length > 0 && <div className="mt-3 rounded-xl border border-[#edf1ed] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#829086]">Model predictions</p><div className="mt-2 space-y-2">{result.predictions.map((p) => <div key={p.className} className="flex items-center justify-between gap-3 text-[11px]"><span className="text-[#526b59]">{p.className}</span><span className="shrink-0 font-semibold text-[#829086]">{(p.probability * 100).toFixed(1)}%</span></div>)}</div></div>}
            </div>}
            <div className="mt-5 rounded-xl bg-[#f5f9f5] p-4"><div className="flex items-center gap-2 text-xs font-extrabold text-[#2e6542]"><Leaf size={16} /> Recommended next action</div><p className="mt-2 text-xs leading-6 text-[#637768]">{result.recommendation}</p></div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#355441]">Your next steps</h3>
            <div className="mt-4 space-y-3">{result.steps.map((step, i) => <div key={`${step}-${i}`} className="flex gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf5ed] text-[11px] font-extrabold text-[#278354]">{i + 1}</div><p className="pt-1 text-xs leading-5 text-[#708276]">{step}</p></div>)}</div>
            <div className="mt-5 flex gap-2 rounded-xl border border-[#f0dfb7] bg-[#fff9e9] p-3"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#a57525]" /><p className="text-[11px] leading-5 text-[#876d3e]">{result.safety}</p></div>
          </div>
        </div>
        <div className="border-t border-[#edf1ed] p-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={saveScan} disabled={alreadySaved} className="flex items-center justify-center gap-2 rounded-xl bg-[#176b48] px-5 py-3 text-xs font-extrabold text-white transition hover:bg-[#105638] disabled:cursor-not-allowed disabled:opacity-60">{alreadySaved ? <CheckCircle2 size={17} /> : <Save size={17} />}{alreadySaved ? "Saved to Material Tracking" : "Save to Material Tracking"}</button>{alreadySaved && <span className="flex items-center gap-1.5 text-xs font-semibold text-[#278354]"><CheckCircle2 size={15} />Record saved</span>}</div>
          {saveMessage && <p role="status" className="mt-3 text-xs text-[#278354]">{saveMessage}</p>}
          {saveError && <p role="alert" className="mt-3 text-xs text-[#b63f38]">{saveError}</p>}
          <p className="mt-3 text-[10px] leading-5 text-[#98a49a]">The record is stored in this browser. Weight is set to 0 kg because the scanner cannot measure an item's weight.</p>
        </div>
      </section>}

      <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-[#eaf5ed] p-3 text-[#278354]"><Sparkles size={20} /></div><div className="flex-1">
          <h2 className="text-sm font-extrabold text-[#254330]">Preview the complete workflow</h2>
          <p className="mt-1 text-xs leading-5 text-[#89968c]">Choose a sample recommendation. This does not classify your uploaded image.</p>
          <label htmlFor="demo-category" className="mt-4 block text-xs font-bold text-[#526b59]">Select a demo scenario</label>
          <select id="demo-category" value={demoCategory} onChange={(e) => setDemoCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-3 text-xs text-[#385442] outline-none focus:border-[#58a777]">{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          <button type="button" onClick={runDemo} disabled={!image || status === "loading"} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfe2d1] px-4 py-3 text-xs font-extrabold text-[#26764a] transition hover:bg-[#f1f8f2] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">Preview demo recommendation <ArrowRight size={15} /></button>
        </div></div>
      </section>
    </div>
  );
}
