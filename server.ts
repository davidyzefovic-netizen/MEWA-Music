import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import fsx from "fs-extra";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";

async function startServer() {

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mewa';
console.log('Connecting to database:', dbUrl.replace(/:[^:@]+@/, ':***@'));
const pool = new Pool({
  connectionString: dbUrl,
});

let usePg = false;
const fallbackDbDir = path.join(process.cwd(), "db_fallback");

async function initDb() {
  try {
    await pool.query("SELECT 1"); // Test connection
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        collection TEXT,
        id TEXT,
        data JSONB,
        PRIMARY KEY (collection, id)
      );
    `);
    console.log("Database initialized successfully with Postgres.");
    usePg = true;
  } catch (err: any) {
    console.warn("Failed to connect to Postgres, falling back to local JSON storage. Error:", err.message);
    usePg = false;
    fsx.ensureDirSync(fallbackDbDir);
  }
}

// JSON Fallback Helpers
const getFallbackPath = (col: string) => path.join(fallbackDbDir, `${col}.json`);
async function readFallback(col: string) {
  const p = getFallbackPath(col);
  if (fsx.existsSync(p)) return await fsx.readJson(p);
  return {};
}
async function writeFallback(col: string, data: any) {
  await fsx.writeJson(getFallbackPath(col), data, { spaces: 2 });
}

async function getDocDb(collection: string, id: string) {
  if (usePg) {
    const res = await pool.query('SELECT data FROM documents WHERE collection = $1 AND id = $2', [collection, id]);
    return res.rows.length > 0 ? res.rows[0].data : null;
  } else {
    const data = await readFallback(collection);
    return data[id] || null;
  }
}

async function setDocDb(collection: string, id: string, data: any) {
  if (usePg) {
    await pool.query(
      'INSERT INTO documents (collection, id, data) VALUES ($1, $2, $3) ON CONFLICT (collection, id) DO UPDATE SET data = $3',
      [collection, id, data]
    );
  } else {
    const allData = await readFallback(collection);
    allData[id] = data;
    await writeFallback(collection, allData);
  }
}

async function getAllDocsDb(collection: string) {
  if (usePg) {
    const res = await pool.query('SELECT data FROM documents WHERE collection = $1', [collection]);
    return res.rows.map(r => r.data);
  } else {
    const data = await readFallback(collection);
    return Object.values(data);
  }
}

async function deleteDocDb(collection: string, id: string) {
  if (usePg) {
    await pool.query('DELETE FROM documents WHERE collection = $1 AND id = $2', [collection, id]);
  } else {
    const data = await readFallback(collection);
    delete data[id];
    await writeFallback(collection, data);
  }
}

  await initDb();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  // Setup Multer for file uploads
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"));
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for zip files
  });

  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadDir));

  // Upload API route
  app.post("/api/upload", handleUpload("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Upload Archive API route
  app.post("/api/upload-artists-archive", handleUpload("archive"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No archive uploaded" });
    const archivePath = req.file.path;
    const extractDir = path.join(uploadDir, "temp_extract_artists_" + Date.now());
    let logs: string[] = [];
    const stats = { added: 0, skipped: 0, errors: 0 };
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (msg: string, isError = false) => {
      res.write(`data: ${JSON.stringify({ type: 'log', message: msg, isError })}\n\n`);
      logs.push(msg);
    };

    const flushAndEnd = (result: any) => {
      res.write(`data: ${JSON.stringify({ type: 'complete', ...result })}\n\n`);
      res.end();
    };

    try {
      sendProgress(`Unzipping ${req.file.originalname}...`);
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(extractDir, true);
      sendProgress(`Extracted successfully.`);

      const artistsDir = path.join(uploadDir, "artists");
      await fsx.ensureDir(artistsDir);

      let artistsJsonPath = path.join(extractDir, "artists.json");
      let artistsData: any[] = [];
      
      if (!fs.existsSync(artistsJsonPath)) {
        const rootItems = await fsx.readdir(extractDir);
        if (rootItems.length === 1) {
            const nestedPath = path.join(extractDir, rootItems[0]);
            const stat = await fsx.stat(nestedPath);
            if (stat.isDirectory() && fs.existsSync(path.join(nestedPath, "artists.json"))) {
                artistsJsonPath = path.join(nestedPath, "artists.json");
                sendProgress("Found nested artists.json.");
            }
        }
      }

      if (fs.existsSync(artistsJsonPath)) {
        sendProgress("Found artists.json, using as primary data source.");
        try {
          artistsData = await fsx.readJson(artistsJsonPath);
          if (!Array.isArray(artistsData) || artistsData.length === 0) {
            sendProgress("Error: artists.json is empty or invalid format (must be array).", true);
            artistsData = [];
          }
        } catch (e: any) {
          sendProgress("Error parsing artists.json: " + e.message, true);
        }
      } else {
        sendProgress("No artists.json found.", true);
        flushAndEnd({ stats });
        return;
      }

      sendProgress(`Processing ${artistsData.length} artists...`);
      const baseDir = path.dirname(artistsJsonPath);

      for (let i = 0; i < artistsData.length; i++) {
        const a = artistsData[i];
        sendProgress(`Progress: ${Math.round((i / artistsData.length) * 100)}%`);
        sendProgress(`Processing artist: ${a.id} (${a.name})`);
        
        const existingArtist = await getDocDb('artists', a.id);
        if (existingArtist) {
           sendProgress(`Artist ${a.id} already exists, skipping.`, false);
           stats.skipped++;
           continue;
        }

        let photoUrl = "";
        if (a.photo) {
           const photoFilePath = path.join(baseDir, a.photo);
           if (fs.existsSync(photoFilePath)) {
              const ext = path.extname(a.photo);
              const newPhotoName = `${a.id}${ext}`;
              const destPath = path.join(artistsDir, newPhotoName);
              await fsx.copy(photoFilePath, destPath);
              photoUrl = `/uploads/artists/${newPhotoName}`;
           } else {
              sendProgress(`Photo missing for ${a.id}: ${a.photo}`, true);
           }
        }

        const newArtist = {
            id: a.id,
            name: a.name,
            bio: a.bio || "",
            imageUrl: photoUrl,
            genres: a.genre ? [a.genre] : [],
            albums: [],
            songs: [],
            createdBy: "admin",
            createdAt: new Date().toISOString()
        };

        if (a.tags && Array.isArray(a.tags)) {
            newArtist.genres = [...new Set([...newArtist.genres, ...a.tags])];
        }

        await setDocDb('artists', a.id, newArtist);
        sendProgress(`Successfully added artist ${a.name}`);
        stats.added++;
      }

      sendProgress(`Progress: 100%`);
      sendProgress(`Batch process finished. Added: ${stats.added}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
      flushAndEnd({ stats });
    } catch (err: any) {
      sendProgress(`Fatal error: ${err.message}`, true);
      flushAndEnd({ stats });
    } finally {
      if (fs.existsSync(archivePath)) {
        await fsx.remove(archivePath);
      }
      await fsx.remove(extractDir).catch(e => console.error("Cleanup error:", e));
    }
  });

  function handleUpload(field) { return function(req, res, next) {
    upload.single(field)(req, res, (err) => {
      if (err) {
        if (err.message === 'Request aborted') {
          console.error("Upload aborted! This is usually caused by PM2 --watch restarting the server when the file is written, or Nginx closing the connection due to client_max_body_size limit.");
          return res.status(400).json({ error: "Upload aborted (check PM2 watch or Nginx client_max_body_size)" });
        }
        console.error("Upload error:", err);
        return res.status(500).json({ error: "Upload error: " + err.message });
      }
      next();
    });
  };
}

  app.post("/api/upload-archive", handleUpload("archive"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No archive uploaded" });
    }
    const archivePath = req.file.path;
    const extractDir = path.join(uploadDir, "temp_extract_" + Date.now());
    let logs: string[] = [];
    const stats = { added: 0, skipped: 0, errors: 0 };
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (msg: string, isError = false) => {
      res.write(`data: ${JSON.stringify({ type: 'log', message: msg, isError })}\n\n`);
      logs.push(msg);
    };
    const flushAndEnd = (result: any) => {
      res.write(`data: ${JSON.stringify({ type: 'complete', ...result })}\n\n`);
      res.end();
    };

    try {
      sendProgress(`Unzipping ${req.file.originalname}...`);
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(extractDir, true);
      sendProgress(`Extracted successfully.`);

      // Setup directories for physical files
      const songsDir = path.join(uploadDir, "songs");
      await fsx.ensureDir(songsDir);

      let indexJsonPath = path.join(extractDir, "index.json");
      let tracks: any[] = [];
      
      // Try to find index.json if it's nested
      if (!fs.existsSync(indexJsonPath)) {
        const rootItems = await fsx.readdir(extractDir);
        if (rootItems.length === 1) {
            const nestedPath = path.join(extractDir, rootItems[0]);
            const stat = await fsx.stat(nestedPath);
            if (stat.isDirectory() && fs.existsSync(path.join(nestedPath, "index.json"))) {
                indexJsonPath = path.join(nestedPath, "index.json");
                sendProgress("Found nested index.json.");
            }
        }
      }

      if (fs.existsSync(indexJsonPath)) {
        sendProgress("Found index.json, using as primary data source.");
        try {
          tracks = await fsx.readJson(indexJsonPath);
          if (!Array.isArray(tracks) || tracks.length === 0) {
            sendProgress("Error: index.json is empty or invalid format (must be array).", true);
            tracks = [];
          }
        } catch (e: any) {
          sendProgress("Error parsing index.json: " + e.message, true);
        }
      } else {
        sendProgress("No index.json found, falling back to manual scan.");
        const extractedSongsDir = path.join(extractDir, "songs");
        if (fs.existsSync(extractedSongsDir)) {
           const items = await fsx.readdir(extractedSongsDir);
           for (const item of items) {
              const itemPath = path.join(extractedSongsDir, item);
              const stat = await fsx.stat(itemPath);
              if (stat.isDirectory()) {
                 const artistTracks = await fsx.readdir(itemPath);
                 for (const tr of artistTracks) {
                    if (tr.endsWith('.mp3') || tr.endsWith('.m4a') || tr.endsWith('.wav')) {
                       tracks.push({
                          id: `${item}-${tr.replace(/\.(mp3|m4a|wav)$/i, '')}`,
                          title: tr.replace(/\.(mp3|m4a|wav)$/i, ''),
                          artist: item,
                          artistId: item,
                          album: item,
                          albumId: item,
                          audioFile: `songs/${item}/${tr}`
                       });
                    }
                 }
              } else if (item.endsWith('.mp3') || item.endsWith('.m4a') || item.endsWith('.wav')) {
                 const base = item.replace(/\.(mp3|m4a|wav)$/i, '');
                 const parts = base.split('-');
                 tracks.push({
                    id: base,
                    title: parts[1] || base,
                    artist: parts[0] || 'Unknown',
                    artistId: parts[0] ? parts[0].toLowerCase() : 'unknown',
                    album: parts[0] || 'Unknown',
                    albumId: parts[0] ? parts[0].toLowerCase() : 'unknown',
                    audioFile: `songs/${item}`
                 });
              }
           }
        }
      }

      sendProgress(`Processing ${tracks.length} tracks...`);
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        
        sendProgress(`Progress: ${Math.round((i / tracks.length) * 100)}%`);
        sendProgress(`Processing track: ${t.id} (${t.title})`);
        
        // Skip if already in database
        const existingTrack = await getDocDb('songs', t.id);
        if (existingTrack) {
           sendProgress(`Track ${t.id} already exists, skipping.`, false);
           stats.skipped++;
           continue;
        }

        // Adjust paths if index.json was nested
        const baseDir = path.dirname(indexJsonPath);
        const audioFilePath = path.join(baseDir, t.audioFile);
        if (!fs.existsSync(audioFilePath)) {
          sendProgress(`Audio file missing for ${t.id}: ${t.audioFile}`, true);
          stats.errors++;
          continue;
        }

        const artistId = t.artistId || t.artist.toLowerCase().replace(/[^a-z0-9]/g, '');
        const trackId = t.id || `${artistId}-${t.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        const artistSongsDir = path.join(songsDir, artistId);
        await fsx.ensureDir(artistSongsDir);

        const destAudio = path.join(artistSongsDir, `${trackId}.mp3`);
        await fsx.copy(audioFilePath, destAudio);

        let coverFileUrl = `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400`;
        if (t.coverFile) {
          const coverFilePath = path.join(baseDir, t.coverFile);
          if (fs.existsSync(coverFilePath)) {
            const ext = path.extname(t.coverFile) || '.jpg';
            const destCover = path.join(artistSongsDir, `${trackId}${ext}`);
            await fsx.copy(coverFilePath, destCover);
            coverFileUrl = `/uploads/songs/${artistId}/${trackId}${ext}`;
          }
        }

        // Write artist to DB
        let artistData = await getDocDb('artists', artistId);
        if (!artistData) {
            artistData = { id: artistId, name: t.artist, imageUrl: coverFileUrl, bio: "", createdBy: "admin", createdAt: new Date().toISOString() };
        }
        
        // Ensure arrays exist
        artistData.songs = artistData.songs || [];
        artistData.genres = artistData.genres || [];
        artistData.albums = artistData.albums || [];

        // Try to find an artist-specific cover in the zip
        const artistCoverPathJpg = path.join(baseDir, "songs", `${artistId}-cover.jpg`);
        const artistCoverPathPng = path.join(baseDir, "songs", `${artistId}-cover.png`);
        
        if (fs.existsSync(artistCoverPathJpg)) {
            const destArtistCover = path.join(artistSongsDir, `${artistId}-cover.jpg`);
            await fsx.copy(artistCoverPathJpg, destArtistCover);
            artistData.imageUrl = `/uploads/songs/${artistId}/${artistId}-cover.jpg`;
        } else if (fs.existsSync(artistCoverPathPng)) {
            const destArtistCover = path.join(artistSongsDir, `${artistId}-cover.png`);
            await fsx.copy(artistCoverPathPng, destArtistCover);
            artistData.imageUrl = `/uploads/songs/${artistId}/${artistId}-cover.png`;
        } else if (!artistData.imageUrl || artistData.imageUrl.includes('unsplash.com')) {
            // Fallback to the track's cover
            artistData.imageUrl = coverFileUrl;
        }

        if (!artistData.songs.includes(trackId)) artistData.songs.push(trackId);
        if (t.genre && !artistData.genres.includes(t.genre)) artistData.genres.push(t.genre);
        const albumId = t.albumId || t.album.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!artistData.albums.includes(albumId)) artistData.albums.push(albumId);
        await setDocDb('artists', artistId, artistData);

        // Write album to DB
        let albumData = await getDocDb('albums', albumId);
        if (!albumData) {
            albumData = { id: albumId, title: t.album, artistId: artistId, artistName: t.artist, coverUrl: coverFileUrl, releaseYear: String(t.year || new Date().getFullYear()), createdBy: "admin", createdAt: new Date().toISOString() };
        }
        albumData.songs = albumData.songs || [];
        if (!albumData.songs.includes(trackId)) albumData.songs.push(trackId);
        await setDocDb('albums', albumId, albumData);

        // Write song to DB
        await setDocDb('songs', trackId, {
           id: trackId,
           title: t.title,
           artist: t.artist,
           album: t.album,
           audioUrl: `/uploads/songs/${artistId}/${trackId}${path.extname(req.files['audio'][0].originalname)}`,
           coverUrl: coverFileUrl,
           lyrics: t.lyrics || "",
           genres: t.genre ? [t.genre] : [],
           tags: t.tags || [],
           year: t.year || new Date().getFullYear(),
           status: "approved"
        });

        stats.added++;
      }

      sendProgress(`Progress: 100%`);
      sendProgress(`Processing complete! Added: ${stats.added}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
      
      // Cleanup
      await fsx.remove(extractDir);
      await fsx.remove(archivePath);
      flushAndEnd({ stats });
    } catch (err: any) {
      sendProgress(`Fatal error: ${err.message}`, true);
      if (fs.existsSync(extractDir)) await fsx.remove(extractDir);
      if (fs.existsSync(archivePath)) await fsx.remove(archivePath);
      res.end();
    }
  });

  // Data API routes
  app.get("/api/songs", async (req, res) => {
    try { res.json(await getAllDocsDb('songs')); } catch (err) { res.status(500).json({ error: "Failed to read songs" }); }
  });
  app.get("/api/artists", async (req, res) => {
    try { res.json(await getAllDocsDb('artists')); } catch (err) { res.status(500).json({ error: "Failed to read artists" }); }
  });
  app.get("/api/albums", async (req, res) => {
    try { res.json(await getAllDocsDb('albums')); } catch (err) { res.status(500).json({ error: "Failed to read albums" }); }
  });

  // Unified Firebase replacement routes
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
        const data = await getDocDb(req.params.col, req.params.id);
        res.json(data || null);
     } catch(err) { res.status(500).json(null); }
  });

  app.post("/api/db/:col", async (req, res) => {
     try {
        const id = req.body.id || 'id_' + Date.now();
        const obj = { ...req.body, id };
        await setDocDb(req.params.col, id, obj);
        res.json({ id });
     } catch(err: any) { res.status(500).json({error: err.message}); }
  });

  app.post("/api/db/:col/:id", async (req, res) => {
     try {
        const obj = { ...req.body, id: req.params.id };
        await setDocDb(req.params.col, req.params.id, obj);
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
  });

  // Auth API
  app.post("/api/auth/register", express.json(), async (req, res) => {
    try {
      const { email, password } = req.body;
      const existing = await getDocDb('auth', email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const uid = "user-" + Date.now();
      await setDocDb('auth', email, { email, password, uid });
      res.json({ uid, email, displayName: email.split('@')[0] });
    } catch(err) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/auth/login", express.json(), async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await getDocDb('auth', email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      res.json({ uid: user.uid, email: user.email, displayName: user.email.split('@')[0] });
    } catch(err) { res.status(500).json({ error: err.message }); }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
