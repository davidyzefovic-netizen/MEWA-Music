const fs = require('fs');
let code = fs.readFileSync('src/components/AuthorPanel.tsx', 'utf8');

const targetStr = `          {uploadMode === "none" && !editingSong && (`;
const insertStr = `          {uploadMode === "batch" && (
            <div className="relative">
              <button 
                onClick={() => setUploadMode("none")}
                className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-none bg-zinc-200 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
              <BatchUploadPanel authorId={userProfile?.uid || ""} authorName={userProfile?.displayName || ""} authorRole={userProfile?.role || "user"} />
            </div>
          )}

          {uploadMode === "none" && !editingSong && (`;

code = code.replace(targetStr, insertStr);
fs.writeFileSync('src/components/AuthorPanel.tsx', code);
console.log("Inserted BatchUploadPanel");
