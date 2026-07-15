// Firebase is disabled as per instructions.
// This is a custom mock that talks to our backend `/api/db` to simulate the API signature.

export const app = null;
export const db = {} as any;

let listeners: any[] = [];
let internalUser: any = null; // Start logged out

try {
  const savedUser = localStorage.getItem("mewa_mock_user");
  if (savedUser) {
    internalUser = JSON.parse(savedUser);
  }
} catch (e) {}

const notifyListeners = () => {
  try {
    if (internalUser) {
      localStorage.setItem("mewa_mock_user", JSON.stringify(internalUser));
    } else {
      localStorage.removeItem("mewa_mock_user");
    }
  } catch (e) {}
  listeners.forEach(cb => cb(internalUser));
};

export const auth = {
  onAuthStateChanged: (cb: any) => {
    listeners.push(cb);
    cb(internalUser); // Fire immediately
    return () => {
      listeners = listeners.filter(l => l !== cb);
    };
  },
  get currentUser() {
    return internalUser;
  }
} as any;

export const storage = {} as any;
export const googleProvider = {} as any;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleFirestoreError() {}

export async function loginWithGoogle() {
  internalUser = {
    uid: "google-user-" + Date.now(),
    email: "testuser@gmail.com",
    displayName: "Test User",
  };
  notifyListeners();
  return internalUser;
}

export async function loginWithEmail(e: any, p: any) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: e, password: p })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  internalUser = data;
  notifyListeners();
  return internalUser;
}

export async function registerWithEmail(e: any, p: any) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: e, password: p })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  internalUser = data;
  notifyListeners();
  return internalUser;
}

export async function logoutUser() {
  internalUser = null;
  notifyListeners();
}

// Custom firestore API wrappers targeting /api/db
export const collection = (db: any, path: string, ...rest: string[]) => {
  return { path: [path, ...rest].join('-') }; // Use dash for nested subcollections like users-userId-favorites
};

export const doc = (db: any, path: string, ...rest: string[]) => {
  if (rest.length % 2 === 1) { // It's an id
     const id = rest.pop();
     return { path: [path, ...rest].join('-'), id };
  }
  return { path: [path, ...rest].join('-') };
};

export const query = (col: any, ...constraints: any[]) => {
  return { ...col, constraints };
};

export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, dir: string) => ({ type: 'orderBy', field, dir });
export const limit = (num: number) => ({ type: 'limit', num });

export const getDoc = async (d: any) => {
  if (!d.id) return { exists: () => false, data: () => null };
  const res = await fetch(`/api/db/${d.path}/${d.id}`);
  if (!res.ok) return { exists: () => false, data: () => null };
  const data = await res.json();
  if (!data) return { exists: () => false, data: () => null };
  return { exists: () => true, data: () => data };
};

export const getDocs = async (q: any) => {
  let url = `/api/db/${q.path}`;
  if (q.constraints) {
     const params = new URLSearchParams();
     q.constraints.forEach((c: any) => {
        if (c.type === 'where') params.append('where', `${c.field}:${c.op}:${c.value}`);
     });
     url += '?' + params.toString();
  }
  const res = await fetch(url);
  const items = await res.json() || [];
  return { forEach: (cb: any) => items.forEach((data: any) => cb({ data: () => data, id: data.id })) };
};

export const setDoc = async (d: any, data: any) => {
  if (d.id) {
     await fetch(`/api/db/${d.path}/${d.id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  } else {
     await fetch(`/api/db/${d.path}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  }
};

export const updateDoc = async (d: any, data: any) => {
  if (d.id) {
     await fetch(`/api/db/${d.path}/${d.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  }
};

export const addDoc = async (col: any, data: any) => {
  const res = await fetch(`/api/db/${col.path}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
  const result = await res.json();
  return { id: result.id };
};

export const deleteDoc = async (d: any) => {
  if (d.id) {
     await fetch(`/api/db/${d.path}/${d.id}`, { method: 'DELETE' });
  }
};

export const increment = (n: number) => ({ _increment: n });

export const writeBatch = () => {
  const ops: any[] = [];
  return { 
     set: (d: any, data: any) => ops.push(() => setDoc(d, data)), 
     update: (d: any, data: any) => ops.push(() => updateDoc(d, data)), 
     delete: (d: any) => ops.push(() => deleteDoc(d)), 
     commit: async () => {
        for (const op of ops) await op();
     }
  };
};

export const onSnapshot = (q: any, cb: any, errCb?: any) => {
  let isActive = true;
  const poll = async () => {
    if (!isActive) return;
    try {
      const snap = await getDocs(q);
      if (isActive) cb(snap);
    } catch(e) {}
    if (isActive) setTimeout(poll, 3000); // 3 sec polling
  };
  poll();
  return () => { isActive = false; };
};
