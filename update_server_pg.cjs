const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Add imports
content = content.replace('import express from "express";', 'import express from "express";\nimport { Pool } from "pg";\nimport dotenv from "dotenv";\ndotenv.config();');

// 2. Add pg initialization
const initPg = `
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mewa',
});

async function initDb() {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS documents (
      collection TEXT,
      id TEXT,
      data JSONB,
      PRIMARY KEY (collection, id)
    );
  \`);
}

async function getDocDb(collection: string, id: string) {
  const res = await pool.query('SELECT data FROM documents WHERE collection = $1 AND id = $2', [collection, id]);
  return res.rows.length > 0 ? res.rows[0].data : null;
}

async function setDocDb(collection: string, id: string, data: any) {
  await pool.query(
    'INSERT INTO documents (collection, id, data) VALUES ($1, $2, $3) ON CONFLICT (collection, id) DO UPDATE SET data = $3',
    [collection, id, data]
  );
}

async function getAllDocsDb(collection: string) {
  const res = await pool.query('SELECT data FROM documents WHERE collection = $1', [collection]);
  return res.rows.map(r => r.data);
}

async function deleteDocDb(collection: string, id: string) {
  await pool.query('DELETE FROM documents WHERE collection = $1 AND id = $2', [collection, id]);
}
`;

content = content.replace('async function startServer() {', `async function startServer() {\n${initPg}\n  await initDb();`);

// 3. Replace upload metadata logic
const uploadMetadataOld = `
        // Write artist
        const artistJsonPath = path.join(artistsDir, \`\${artistId}.json\`);
        let artistData = { id: artistId, name: t.artist, photo: coverFileUrl, bio: "", genres: [] as string[], albums: [] as string[], songs: [] as string[] };
        if (fs.existsSync(artistJsonPath)) artistData = await fsx.readJson(artistJsonPath);
        if (!artistData.songs.includes(trackId)) artistData.songs.push(trackId);
        if (t.genre && !artistData.genres.includes(t.genre)) artistData.genres.push(t.genre);
        const albumId = t.albumId || t.album.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!artistData.albums.includes(albumId)) artistData.albums.push(albumId);
        await fsx.writeJson(artistJsonPath, artistData, { spaces: 2 });

        // Write album
        const albumJsonPath = path.join(albumsDir, \`\${albumId}.json\`);
        let albumData = { id: albumId, name: t.album, artist: artistId, cover: coverFileUrl, year: t.year || new Date().getFullYear(), songs: [] as string[] };
        if (fs.existsSync(albumJsonPath)) albumData = await fsx.readJson(albumJsonPath);
        if (!albumData.songs.includes(trackId)) albumData.songs.push(trackId);
        await fsx.writeJson(albumJsonPath, albumData, { spaces: 2 });

        // Add to global
        globalIndex.songs.push({
           id: trackId,
           title: t.title,
           artist: t.artist,
           album: t.album,
           audioUrl: \`/uploads/songs/\${artistId}/\${trackId}.mp3\`,
           coverUrl: coverFileUrl,
           lyrics: t.lyrics || "",
           genres: t.genre ? [t.genre] : [],
           tags: t.tags || [],
           year: t.year || new Date().getFullYear(),
           status: "approved"
        });
        stats.added++;
`;

const uploadMetadataNew = `
        // Write artist
        let artistData = await getDocDb('artists', artistId) || { id: artistId, name: t.artist, photo: coverFileUrl, bio: "", genres: [] as string[], albums: [] as string[], songs: [] as string[] };
        if (!artistData.songs.includes(trackId)) artistData.songs.push(trackId);
        if (t.genre && !artistData.genres.includes(t.genre)) artistData.genres.push(t.genre);
        const albumId = t.albumId || t.album.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!artistData.albums.includes(albumId)) artistData.albums.push(albumId);
        await setDocDb('artists', artistId, artistData);

        // Write album
        let albumData = await getDocDb('albums', albumId) || { id: albumId, name: t.album, artist: artistId, cover: coverFileUrl, year: t.year || new Date().getFullYear(), songs: [] as string[] };
        if (!albumData.songs.includes(trackId)) albumData.songs.push(trackId);
        await setDocDb('albums', albumId, albumData);

        // Add to global
        const songData = {
           id: trackId,
           title: t.title,
           artist: t.artist,
           album: t.album,
           audioUrl: \`/uploads/songs/\${artistId}/\${trackId}.mp3\`,
           coverUrl: coverFileUrl,
           lyrics: t.lyrics || "",
           genres: t.genre ? [t.genre] : [],
           tags: t.tags || [],
           year: t.year || new Date().getFullYear(),
           status: "approved"
        };
        await setDocDb('songs', trackId, songData);
        globalIndex.songs.push(songData);
        stats.added++;
`;

content = content.replace(uploadMetadataOld, uploadMetadataNew);

// Remove the old globalIndex initialization that relied on fs:
const globalIndexInitOld = `      const globalIndexFile = path.join(uploadDir, "songs.json");
      let globalIndex = { songs: [] as any[] };
      if (fs.existsSync(globalIndexFile)) {
         globalIndex = await fsx.readJson(globalIndexFile);
      }
`;
const globalIndexInitNew = `      let globalIndex = { songs: await getAllDocsDb('songs') };\n`;
content = content.replace(globalIndexInitOld, globalIndexInitNew);

// Remove the old globalIndex save that relied on fs:
const globalIndexSaveOld = `      await fsx.writeJson(globalIndexFile, globalIndex, { spaces: 2 });`;
const globalIndexSaveNew = `      // Handled individually in Postgres`;
content = content.replace(globalIndexSaveOld, globalIndexSaveNew);


// 4. Update the Data API routes
const dataApiRoutesOld = `  // Data API routes
  app.get("/api/songs", async (req, res) => {
    try {
      const globalIndexFile = path.join(uploadDir, "songs.json");
      if (fs.existsSync(globalIndexFile)) {
        const data = await fsx.readJson(globalIndexFile);
        res.json(data.songs);
      } else {
        res.json([]);
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to read songs" });
    }
  });

  app.get("/api/artists", async (req, res) => {
    try {
      const artistsDir = path.join(uploadDir, "artists");
      if (fs.existsSync(artistsDir)) {
        const files = await fsx.readdir(artistsDir);
        const artists = [];
        for (const file of files) {
          if (file.endsWith(".json")) {
            const data = await fsx.readJson(path.join(artistsDir, file));
            artists.push(data);
          }
        }
        res.json(artists);
      } else {
        res.json([]);
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to read artists" });
    }
  });

  app.get("/api/albums", async (req, res) => {
    try {
      const albumsDir = path.join(uploadDir, "albums");
      if (fs.existsSync(albumsDir)) {
        const files = await fsx.readdir(albumsDir);
        const albums = [];
        for (const file of files) {
          if (file.endsWith(".json")) {
            const data = await fsx.readJson(path.join(albumsDir, file));
            albums.push(data);
          }
        }
        res.json(albums);
      } else {
        res.json([]);
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to read albums" });
    }
  });`;

const dataApiRoutesNew = `  // Data API routes
  app.get("/api/songs", async (req, res) => {
    try { res.json(await getAllDocsDb('songs')); } catch (err) { res.status(500).json({ error: "Failed to read songs" }); }
  });

  app.get("/api/artists", async (req, res) => {
    try { res.json(await getAllDocsDb('artists')); } catch (err) { res.status(500).json({ error: "Failed to read artists" }); }
  });

  app.get("/api/albums", async (req, res) => {
    try { res.json(await getAllDocsDb('albums')); } catch (err) { res.status(500).json({ error: "Failed to read albums" }); }
  });`;

content = content.replace(dataApiRoutesOld, dataApiRoutesNew);

// 5. Update /api/db endpoints
const dbEndpointsOld = `  // Mock Firebase replacement using JSON file based storage
  const dbDir = path.join(uploadDir, "db");
  fsx.ensureDirSync(dbDir);
  
  
  const getDbPath = (collection) => path.join(dbDir, \`\${collection}.json\`);
  
  const readDb = async (collection) => {
    if (collection === 'songs') {
      const p = path.join(uploadDir, "songs.json");
      if (fsx.existsSync(p)) {
         const data = await fsx.readJson(p);
         const map = {};
         if (data.songs) {
            data.songs.forEach(s => { map[s.id] = s; });
         }
         return map;
      }
      return {};
    }
    const p = getDbPath(collection);
    if (fsx.existsSync(p)) return await fsx.readJson(p);
    return {};
  };
  
  const writeDb = async (collection, data) => {
    if (collection === 'songs') {
      const p = path.join(uploadDir, "songs.json");
      const list = Object.values(data);
      let existing = { songs: [] };
      if (fsx.existsSync(p)) existing = await fsx.readJson(p);
      existing.songs = list;
      await fsx.writeJson(p, existing, { spaces: 2 });
      return;
    }
    await fsx.writeJson(getDbPath(collection), data, { spaces: 2 });
  };

  app.get("/api/db/:col", async (req, res) => {
    try {
      const data = await readDb(req.params.col);
      let items = Object.values(data);
      if (req.query.where) {
        const [field, op, value] = (req.query.where as string).split(':');
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
           if (v && typeof v === 'object' && (v as any)._increment) {
              newObj[k] = (newObj[k] || 0) + (v as any)._increment;
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
  });`;

const dbEndpointsNew = `  // API mapped to Postgres
  app.get("/api/db/:col", async (req, res) => {
    try {
      let items = await getAllDocsDb(req.params.col);
      if (req.query.where) {
        const [field, op, value] = (req.query.where as string).split(':');
        items = items.filter((v: any) => {
          if (op === '==') return String(v[field]) === String(value);
          return true;
        });
      }
      res.json(items);
    } catch(err) { res.status(500).json([]); }
  });

  app.get("/api/db/:col/:id", async (req, res) => {
     try {
        const item = await getDocDb(req.params.col, req.params.id);
        res.json(item || null);
     } catch(err) { res.status(500).json(null); }
  });

  app.post("/api/db/:col", async (req, res) => {
     try {
        const id = req.body.id || 'id_' + Date.now();
        const data = { ...req.body, id };
        await setDocDb(req.params.col, id, data);
        res.json({ id });
     } catch(err: any) { res.status(500).json({error: err.message}); }
  });

  app.post("/api/db/:col/:id", async (req, res) => {
     try {
        const data = { ...req.body, id: req.params.id };
        await setDocDb(req.params.col, req.params.id, data);
        res.json({ id: req.params.id });
     } catch(err: any) { res.status(500).json({error: err.message}); }
  });

  app.patch("/api/db/:col/:id", async (req, res) => {
     try {
        let existing = await getDocDb(req.params.col, req.params.id);
        if (!existing) existing = { id: req.params.id };
        const newObj = { ...existing };
        for (const [k, v] of Object.entries(req.body)) {
           if (v && typeof v === 'object' && (v as any)._increment) {
              newObj[k] = (newObj[k] || 0) + (v as any)._increment;
           } else {
              newObj[k] = v;
           }
        }
        await setDocDb(req.params.col, req.params.id, newObj);
        res.json({ id: req.params.id });
     } catch(err: any) { res.status(500).json({error: err.message}); }
  });

  app.delete("/api/db/:col/:id", async (req, res) => {
     try {
        await deleteDocDb(req.params.col, req.params.id);
        res.json({ success: true });
     } catch(err: any) { res.status(500).json({error: err.message}); }
  });`;

content = content.replace(dbEndpointsOld, dbEndpointsNew);

fs.writeFileSync('server.ts', content);

