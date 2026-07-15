const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix duplicate User import
content = content.replace('import { User } from "../types";\n', '');

// Fix missing imports from "./firebase"
const missing = "collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, increment, query, where, onSnapshot";
if (!content.includes('collection, doc')) {
  content = content.replace('import { auth, loginWithGoogle, logoutUser, db, OperationType, handleFirestoreError } from "./firebase";', 
    `import { auth, loginWithGoogle, logoutUser, db, OperationType, handleFirestoreError, ${missing} } from "./firebase";`);
}

fs.writeFileSync('src/App.tsx', content);
