const fs = require('fs');
let panelCode = fs.readFileSync('src/components/BatchUploadPanel.tsx', 'utf8');

panelCode = panelCode.replace('export default function BatchUploadPanel() {', 'export default function BatchUploadPanel({ authorId, authorName }: { authorId: string; authorName: string }) {');

panelCode = panelCode.replace('createdBy: "admin-batch",', 'createdBy: authorId,');
panelCode = panelCode.replace('createdBy: "admin-batch",', 'createdBy: authorId,');
panelCode = panelCode.replace('authorId: "admin-batch",', 'uploadedBy: authorId,\n            authorName: authorName,');
panelCode = panelCode.replace('authorName: "System",', '');

fs.writeFileSync('src/components/BatchUploadPanel.tsx', panelCode);

let authorPanelCode = fs.readFileSync('src/components/AuthorPanel.tsx', 'utf8');
authorPanelCode = authorPanelCode.replace('<BatchUploadPanel />', '<BatchUploadPanel authorId={userProfile?.uid || ""} authorName={userProfile?.displayName || ""} />');
fs.writeFileSync('src/components/AuthorPanel.tsx', authorPanelCode);
console.log("Props updated");
