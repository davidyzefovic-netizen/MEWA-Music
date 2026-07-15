const fs = require('fs-extra');

let content = fs.readFileSync('server.ts', 'utf8');
const searchString = '  // Health check';

const insertion = `
  // Mock Firebase replacement using JSON file based storage
  const dbDir = path.join(uploadDir, "db");
  fsx.ensureDirSync(dbDir);
  
  const getDbPath = (collection) => path.join(dbDir, \`\${collection}.json\`);
  
  const readDb = async (collection) => {
    const p = getDbPath(collection);
    if (fsx.existsSync(p)) return await fsx.readJson(p);
    return {};
  };
  
  const writeDb = async (collection, data) => {
    await fsx.writeJson(getDbPath(collection), data, { spaces: 2 });
  };

  app.get("/api/db/:col", async (req, res) => {
    try {
      const data = await readDb(req.params.col);
      let items = Object.values(data);
      if (req.query.where) {
        const [field, op, value] = req.query.where.split(':');
        items = items.filter((v) => {
          if (op === '==') return String(v[field]) === String(value);
          return true;
        });
      }
      res.json(items);
    } catch(err) { res.status(500).json([]); }
  });

  app.get("/api/db/:col/:id", async (req, res) => {
     try {
        const data = await readDb(req.params.col);
        res.json(data[req.params.id] || null);
     } catch(err) { res.status(500).json(null); }
  });

  app.post("/api/db/:col", async (req, res) => {
     try {
        const data = await readDb(req.params.col);
        const id = req.body.id || 'id_' + Date.now();
        data[id] = { ...req.body, id };
        await writeDb(req.params.col, data);
        res.json({ id });
     } catch(err) { res.status(500).json({error: err.message}); }
  });

  app.post("/api/db/:col/:id", async (req, res) => {
     try {
        const data = await readDb(req.params.col);
        data[req.params.id] = { ...req.body, id: req.params.id };
        await writeDb(req.params.col, data);
        res.json({ id: req.params.id });
     } catch(err) { res.status(500).json({error: err.message}); }
  });

  app.patch("/api/db/:col/:id", async (req, res) => {
     try {
        const data = await readDb(req.params.col);
        if (!data[req.params.id]) data[req.params.id] = { id: req.params.id };
        // simple increment logic mock
        const newObj = { ...data[req.params.id] };
        for (const [k, v] of Object.entries(req.body)) {
           if (v && typeof v === 'object' && v._increment) {
              newObj[k] = (newObj[k] || 0) + v._increment;
           } else {
              newObj[k] = v;
           }
        }
        data[req.params.id] = newObj;
        await writeDb(req.params.col, data);
        res.json({ id: req.params.id });
     } catch(err) { res.status(500).json({error: err.message}); }
  });

  app.delete("/api/db/:col/:id", async (req, res) => {
     try {
        const data = await readDb(req.params.col);
        delete data[req.params.id];
        await writeDb(req.params.col, data);
        res.json({ success: true });
     } catch(err) { res.status(500).json({error: err.message}); }
  });

`;

if (!content.includes('/api/db/:col')) {
  content = content.replace(searchString, insertion + searchString);
  fs.writeFileSync('server.ts', content);
  console.log('injected db routes');
} else {
  console.log('already injected');
}
