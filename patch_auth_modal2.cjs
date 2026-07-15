const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

const replacement = `
            </form>
            <div className="mt-4 mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={\`flex w-full items-center justify-center gap-2 rounded-none py-3 font-sans text-xs font-semibold transition-all border \${
                  darkMode 
                    ? "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-600" 
                    : "border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50"
                }\`}
              >
                <LogIn size={14} />
                Войти через Google
              </button>
            </div>
            <div className="mt-6 text-center">
`;

// use regex to match robustly
content = content.replace(/<\/form>\s*<div className="mt-6 text-center">/, replacement);
fs.writeFileSync('src/components/AuthModal.tsx', content);

