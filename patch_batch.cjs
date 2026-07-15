const fs = require('fs');
let content = fs.readFileSync('src/components/BatchUploadPanel.tsx', 'utf8');

content = content.replace(
  /export default function BatchUploadPanel\(\{ authorId, authorName, authorRole \}: \{ authorId: string; authorName: string; authorRole: string \}\) \{/,
  "export default function BatchUploadPanel({ authorId, authorName, authorRole, onComplete }: { authorId: string; authorName: string; authorRole: string; onComplete?: () => void }) {"
);

content = content.replace(
  /setProgress\(100\);\n                    }/,
  "setProgress(100);\n                        if (onComplete) onComplete();\n                    }"
);

fs.writeFileSync('src/components/BatchUploadPanel.tsx', content);

// Now patch AuthorPanel.tsx to pass onComplete
let authorContent = fs.readFileSync('src/components/AuthorPanel.tsx', 'utf8');
authorContent = authorContent.replace(
  /<BatchUploadPanel\s+authorId=\{userProfile\?\.uid \|\| "anonymous"\}\s+authorName=\{userProfile\?\.displayName \|\| "Admin"\}\s+authorRole=\{userProfile\?\.role \|\| "author"\}\s+\/>/,
  "<BatchUploadPanel authorId={userProfile?.uid || \"anonymous\"} authorName={userProfile?.displayName || \"Admin\"} authorRole={userProfile?.role || \"author\"} onComplete={() => window.location.reload()} />"
);

fs.writeFileSync('src/components/AuthorPanel.tsx', authorContent);

