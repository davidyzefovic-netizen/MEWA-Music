const fs = require('fs');
let content = fs.readFileSync('src/firebase.ts', 'utf8');

content = content.replace('export async function loginWithEmail() { return auth.currentUser; }', 'export async function loginWithEmail(e: any, p: any) { return auth.currentUser; }');
content = content.replace('export async function registerWithEmail() { return auth.currentUser; }', 'export async function registerWithEmail(e: any, p: any) { return auth.currentUser; }');

content = content.replace('export const onSnapshot = (q: any, cb: any) => {', 'export const onSnapshot = (q: any, cb: any, errCb?: any) => {');

fs.writeFileSync('src/firebase.ts', content);
