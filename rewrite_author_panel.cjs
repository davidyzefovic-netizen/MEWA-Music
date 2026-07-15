const fs = require('fs');
let code = fs.readFileSync('src/components/AuthorPanel.tsx', 'utf8');

// Replace boolean with mode
code = code.replace('const [showUploadForm, setShowUploadForm] = useState(false);', 'const [uploadMode, setUploadMode] = useState<"none" | "single" | "batch">("none");');

code = code.replace('import { Song, UserProfile } from "../types";', 'import { Song, UserProfile } from "../types";\nimport BatchUploadPanel from "./BatchUploadPanel";');

// Replace !showUploadForm
const headerButtons = `        {!showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex h-10 items-center gap-1.5 rounded-none bg-red-600 px-5 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition-transform active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" /> Upload New Track
          </button>
        )}`;

const newHeaderButtons = `        {uploadMode === "none" && (
          <div className="flex gap-2">
            <button
              onClick={() => setUploadMode("single")}
              className="flex h-10 items-center gap-1.5 rounded-none bg-red-600 px-5 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition-transform active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" /> Single Track
            </button>
            <button
              onClick={() => setUploadMode("batch")}
              className="flex h-10 items-center gap-1.5 rounded-none bg-zinc-900 px-5 font-sans text-[10px] font-bold uppercase tracking-widest text-white shadow-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-transform active:scale-95"
            >
              <Upload className="h-4.5 w-4.5" /> Batch ZIP
            </button>
          </div>
        )}`;
code = code.replace(headerButtons, newHeaderButtons);

// Replace the form show conditional
const formShowOld = `{showUploadForm && (`;
const formShowNew = `{uploadMode === "single" && (`;
code = code.replace(formShowOld, formShowNew);

// Replace close buttons setting state
code = code.replace(/setShowUploadForm\(false\)/g, 'setUploadMode("none")');

// Replace conditional logic in the middle:
const middleConditionOld = `          {!showUploadForm && !editingSong && (
            <div className="rounded-none border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950 flex flex-col items-center justify-center text-center">
              <Upload className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-4" />
              <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">Welcome to Creator Studio</h3>
              <p className="font-serif text-sm italic text-zinc-500 mt-2 max-w-sm mx-auto">
                Select "Upload New Track" to submit original music for verification. Once approved, your tracks will be available globally.
              </p>
            </div>
          )}`;
const middleConditionNew = `          {uploadMode === "batch" && (
            <div className="relative">
              <button 
                onClick={() => setUploadMode("none")}
                className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-none bg-zinc-200 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
              <BatchUploadPanel />
            </div>
          )}

          {uploadMode === "none" && !editingSong && (
            <div className="rounded-none border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950 flex flex-col items-center justify-center text-center">
              <Upload className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-4" />
              <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">Welcome to Creator Studio</h3>
              <p className="font-serif text-sm italic text-zinc-500 mt-2 max-w-sm mx-auto">
                Select "Single Track" or "Batch ZIP" to submit original music. Once approved, your tracks will be available globally.
              </p>
            </div>
          )}`;
code = code.replace(middleConditionOld, middleConditionNew);

fs.writeFileSync('src/components/AuthorPanel.tsx', code);
console.log("AuthorPanel modified");
