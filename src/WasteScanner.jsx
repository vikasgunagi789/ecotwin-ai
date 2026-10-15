import { useRef, useState } from "react";

import * as mobilenet from "@tensorflow-models/mobilenet";

import * as tf from "@tensorflow/tfjs";

import "@tensorflow/tfjs-backend-webgl";

import "@tensorflow/tfjs-backend-cpu";

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

} from "lucide-react";
  // Load MobileNet once and reuse it for later scans.
let mobileNetModelPromise;





async function getMobileNetModel() {

  if (!mobileNetModelPromise) {

    mobileNetModelPromise = (async () => {
      // Prefer WebGL, but fall back to CPU if WebGL is unavailable.
      let backendReady = false;

      try {
        backendReady = await tf.setBackend("webgl");
      } catch {
        backendReady = false;
      }

      if (!backendReady) {
        try {
          backendReady = await tf.setBackend("cpu");
        } catch {
          backendReady = false;
        }
      }

      await tf.ready();

      if (!backendReady || !tf.getBackend()) {
        throw new Error(
          "TensorFlow.js could not initialize WebGL or CPU processing."
        );
      }

      return mobilenet.load();

    })().catch((error) => {

      mobileNetModelPromise = null;

      throw error;

    });

  }



  return mobileNetModelPromise;

}





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

];



const demoResults = {

  recyclable: {

    material: "Possible recyclable material",

    recommendation:

      "Check the material and local acceptance rules. If accepted, empty and clean the item as appropriate before placing it in the correct recycling stream.",

    steps: ["Check the material label", "Remove leftover contents", "Verify local recycling acceptance"],

    safety:

      "This demo category is not a verified identification of your image.",

  },

  reusable: {

    material: "Potentially reusable item",

    recommendation:

      "Inspect the item for damage and contamination. If it is safe and suitable, reuse, refill, repair or donate it before considering recycling.",

    steps: ["Inspect condition", "Clean if appropriate", "Reuse, repair or donate if suitable"],

    safety:

      "Do not reuse containers that may have held hazardous chemicals or unsafe substances.",

  },

  biodegradable: {

    material: "Possible organic waste",

    recommendation:

      "If the item is suitable organic waste, use an accepted composting or organic-waste collection service. Keep plastics and other contaminants out.",

    steps: ["Check the material", "Separate non-organic contaminants", "Use an appropriate composting stream"],

    safety:

      "Not every item labeled biodegradable is suitable for home composting.",

  },

  hazardous: {

    material: "Potentially hazardous waste",

    recommendation:

      "Keep the item separate from ordinary waste. Follow local hazardous-waste collection guidance and use an authorized collection facility.",

    steps: ["Do not dismantle the item", "Avoid contact with leaking contents", "Find an authorized collection point"],

    safety:

      "This is a conservative demo workflow, not a verified hazard assessment. Do not open, crush or mix potentially hazardous materials.",

  },

};



export default function WasteScanner() {

  const fileInput = useRef(null);

  const [image, setImage] = useState(null);

  const [fileName, setFileName] = useState("");

  const [demoCategory, setDemoCategory] = useState("recyclable");

  const [result, setResult] = useState(null);

  const [status, setStatus] = useState("idle");

  const [error, setError] = useState("");

  const [mode, setMode] = useState("");



  function handleFile(file) {

    if (!file) return;



    if (!file.type.startsWith("image/")) {

      setError("Please select an image file.");

      return;

    }



    if (file.size > 10 * 1024 * 1024) {

      setError("Please choose an image smaller than 10 MB.");

      return;

    }



    setImage((previous) => {

      if (previous) URL.revokeObjectURL(previous);

      return URL.createObjectURL(file);

    });



    setFileName(file.name);

    setResult(null);

    setError("");

    setStatus("idle");

    setMode("");

  }



  function clearImage() {

    if (image) URL.revokeObjectURL(image);

    setImage(null);

    setFileName("");

    setResult(null);

    setError("");

    setStatus("idle");

    setMode("");



    if (fileInput.current) fileInput.current.value = "";

  }









const runAI = async () => {

  if (!image) {

    setError("Please upload a waste image first.");

    return;

  }



  setStatus("loading");

  setError("");

  setResult(null);

  setMode("");



  try {
  // Reuse the TensorFlow.js model loader already in your file.
    const model = await getMobileNetModel();
  // The image state already contains the uploaded image URL.
    const imageElement = new Image();

    imageElement.src = image;



    await new Promise((resolve, reject) => {

      imageElement.onload = resolve;

      imageElement.onerror = () =>

        reject(new Error("The uploaded image could not be loaded."));

    });
  // Recognize the most likely objects in the image.
    const predictions = await model.classify(imageElement, 3);



    if (!predictions || predictions.length === 0) {

      throw new Error("No recognizable object was found.");

    }



    const best = predictions[0];

    const label = best.className.toLowerCase();
  // This mapping is a prototype heuristic, not verified material detection.
    let category = "reusable";



    if (

      /\b(battery|syringe|chemical|pesticide|insecticide)\b/.test(label)

    ) {

      category = "hazardous";

    } else if (

      /\b(banana|apple|orange|lemon|broccoli|food|vegetable|fruit)\b/.test(

        label

      )

    ) {

      category = "biodegradable";

    } else if (

      /\b(bottle|can|carton|paper|cardboard|newspaper|glass|tin|plastic)\b/.test(

        label

      )

    ) {

      category = "recyclable";

    }
  // Keep the result shape compatible with your existing result panel.
    const recommendation = demoResults[category];



    setResult({

      ...recommendation,

      category,

      material: `Model identified: ${best.className}`,

      confidence: best.probability * 100,

      modelLabel: best.className,

      predictions,

    });



    setMode("local");

    setStatus("done");

  } catch (error) {

    console.error("Local waste classification failed:", error);



    setError(

      "Could not analyze this image. Please try another clear photo. " +

        (error?.message || "")

    );



    setStatus("idle");

  }

};









  function runDemo() {

    if (!image) {

      setError("Upload an image before previewing the demo.");

      return;

    }



    const selected = demoResults[demoCategory];



    setResult({

      ...selected,

      category: demoCategory,

      confidence: null,

    });



    setMode("demo");

    setStatus("done");

    setError("");

  }



  const selectedCategory = categories.find(

    (category) => category.id === result?.category

  );



  return (

    <div className="space-y-6">

      <div>

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

      </div>



      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">

        <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-7">

          <div className="flex items-center justify-between gap-3">

            <div>

              <h2 className="text-base font-extrabold text-[#254330]">

                Upload waste image

              </h2>

              <p className="mt-1 text-xs text-[#96a298]">

                JPG, PNG or WEBP · Maximum 10 MB

              </p>

            </div>



            <div className="rounded-xl bg-[#eaf5ed] p-3 text-[#23794a]">

              <Cpu size={22} />

            </div>

          </div>



          <input

            ref={fileInput}

            type="file"

            accept="image/jpeg,image/png,image/webp,image/*"

            className="hidden"

            onChange={(event) => handleFile(event.target.files?.[0])}

          />



          {!image ? (

            <button

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

                <Upload size={15} /> Choose image

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

                  onClick={clearImage}

                  aria-label="Remove selected image"

                  className="absolute right-4 top-4 rounded-xl border border-[#e5ece5] bg-white p-2 text-[#53685a] shadow-sm hover:bg-[#f7faf7]"

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

            onClick={runAI}

            disabled={!image || status === "loading"}

            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#176b48] px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#105638] disabled:cursor-not-allowed disabled:opacity-50"

          >

            {status === "loading" ? (

              <>

                <LoaderCircle size={18} className="animate-spin" />

                Loading browser model...

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

            MobileNet runs in your browser and recognizes common objects.

Its suggestions are limited and may be wrong. It cannot verify

material composition or rule out hazardous waste. Always check

the item and local disposal guidance.

          </p>

        </section>



        <div className="space-y-5">

          <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-6">

            <h2 className="text-sm font-extrabold text-[#254330]">

              Classification categories

            </h2>

            <p className="mt-1 text-[11px] leading-5 text-[#96a298]">

              The four possible disposal pathways.

            </p>



            <div className="mt-5 space-y-3">

              {categories.map(({ id, label, icon: Icon, color, bg, examples }) => (

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

                    <p className="text-xs font-bold text-[#3d5745]">{label}</p>

                    <p className="mt-1 text-[10px] leading-4 text-[#8d9a90]">

                      {examples}

                    </p>

                  </div>

                </div>

              ))}

            </div>

          </section>



          <section className="rounded-2xl border border-[#dcebdd] bg-[#edf7ef] p-5">

            <div className="flex items-center gap-2 text-[#247748]">

              <ShieldCheck size={20} />

              <h2 className="text-sm font-extrabold">Safety-first AI</h2>

            </div>



            <p className="mt-3 text-xs leading-6 text-[#617a67]">

              Uncertain or potentially hazardous items require conservative

              guidance. A model's prediction is not proof of material

              composition or local recyclability.

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

                {mode === "local"

  ? "Browser image model · Suggested category only"

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



              {mode === "local" && (

                <div className="mt-4">

                  <div className="flex items-center justify-between text-xs">

                    <span className="font-semibold text-[#708276]">

                      Model confidence

                    </span>

                    <span className="font-extrabold text-[#267c4d]">

                      {result.confidence.toFixed(1)}%

                    </span>

                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf2ed]">

                    <div

                      className="h-full rounded-full bg-[#399565]"

                      style={{ width: `${result.confidence}%` }}

                    />

                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-[#98a49a]">

                    Confidence is model-specific and does not guarantee that

                    the material or disposal decision is correct.

                  </p>

                </div>

              )}



              <div className="mt-5 rounded-xl bg-[#f5f9f5] p-4">

                <div className="flex items-center gap-2 text-xs font-extrabold text-[#2e6542]">

                  <Leaf size={16} /> Recommended next action

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

                  <div key={`${step}-${index}`} className="flex gap-3">

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

              Until the vision backend is connected, you can preview the

              recommendation interface using a manually selected example.

              This does not classify your uploaded image.

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

              onClick={runDemo}

              disabled={!image}

              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfe2d1] px-4 py-3 text-xs font-extrabold text-[#26764a] transition hover:bg-[#f1f8f2] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"

            >

              Preview demo recommendation <ArrowRight size={15} />

            </button>

          </div>

        </div>

      </section>

    </div>

  );

}
