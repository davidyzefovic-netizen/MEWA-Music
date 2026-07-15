const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We are going to replace everything from `app.post("/api/upload-archive"` down to `// Auth API`

const replaceStartMarker = 'app.post("/api/upload-archive"';
const replaceEndMarker = '// Auth API';

const startIndex = code.indexOf(replaceStartMarker);
const endIndex = code.indexOf(replaceEndMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const newApiSection = `app.post("/api/upload-archive", upload.single("archive"), async (req, res) => {
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
      res.write(\`data: \${JSON.stringify({ type: 'log', message: msg, isError })}\\n\\n\`);
      logs.push(msg);
    };
    const flushAndEnd = (result: any) => {
      res.write(\`data: \${JSON.stringify({ type: 'complete', ...result })}\\n\\n\`);
      res.end();
    };

    try {
      sendProgress(\`Unzipping \${req.file.originalname}...\`);
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(extractDir, true);
      sendProgress(\`Extracted successfully.\`);

      // Setup directories for physical files
      const songsDir = path.join(uploadDir, "songs");
      await fsx.ensureDir(songsDir);

      const indexJsonPath = path.join(extractDir, "index.json");
      let tracks: any[] = [];
      if (fs.existsSync(indexJsonPath)) {
        sendProgress("Found index.json, using as primary data source.");
        tracks = await fsx.readJson(indexJsonPath);
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
                    if (tr.endsWith('.mp3')) {
                       tracks.push({
                          id: \`\${item}-\${tr.replace('.mp3', '')}\`,
                          title: tr.replace('.mp3', ''),
                          artist: item,
                          artistId: item,
                          album: item,
                          albumId: item,
                          audioFile: \`songs/\${item}/\${tr}\`
                       });
                    }
                 }
              } else if (item.endsWith('.mp3')) {
                 const base = item.replace('.mp3', '');
                 const parts = base.split('-');
                 tracks.push({
                    id: base,
                    title: parts[1] || base,
                    artist: parts[0] || 'Unknown',
                    artistId: parts[0] ? parts[0].toLowerCase() : 'unknown',
                    album: parts[0] || 'Unknown',
                    albumId: parts[0] ? parts[0].toLowerCase() : 'unknown',
                    audioFile: \`songs/\${item}\`
                 });
              }
           }
        }
      }

      sendProgress(\`Processing \${tracks.length} tracks...\`);
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        
        sendProgress(\`Progress: \${Math.round((i / tracks.length) * 100)}%\`);
        sendProgress(\`Processing track: \${t.id} (\${t.title})\`);
        
        // Skip if already in database
        const existingTrack = await getDocDb('songs', t.id);
        if (existingTrack) {
           sendProgress(\`Track \${t.id} already exists, skipping.\`, false);
           stats.skipped++;
           continue;
        }

        const audioFilePath = path.join(extractDir, t.audioFile);
        if (!fs.existsSync(audioFilePath)) {
          sendProgress(\`Audio file missing for \${t.id}: \${t.audioFile}\`, true);
          stats.errors++;
          continue;
        }

        const artistId = t.artistId || t.artist.toLowerCase().replace(/[^a-z0-9]/g, '');
        const trackId = t.id || \`\${artistId}-\${t.title.toLowerCase().replace(/[^a-z0-9]/g, '')}\`;

        const artistSongsDir = path.join(songsDir, artistId);
        await fsx.ensureDir(artistSongsDir);

        const destAudio = path.join(artistSongsDir, \`\${trackId}.mp3\`);
        await fsx.copy(audioFilePath, destAudio);

        let coverFileUrl = \`https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400\`;
        if (t.coverFile) {
          const coverFilePath = path.join(extractDir, t.coverFile);
          if (fs.existsSync(coverFilePath)) {
            const ext = path.extname(t.coverFile) || '.jpg';
            const destCover = path.join(artistSongsDir, \`\${trackId}\${ext}\`);
            await fsx.copy(coverFilePath, destCover);
            coverFileUrl = \`/uploads/songs/\${artistId}/\${trackId}\${ext}\`;
          }
        }

        // Write artist to DB
        let artistData = await getDocDb('artists', artistId) || { id: artistId, name: t.artist, photo: coverFileUrl, bio: "", genres: [] as string[], albums: [] as string[], songs: [] as string[] };
        if (!artistData.songs.includes(trackId)) artistData.songs.push(trackId);
        if (t.genre && !artistData.genres.includes(t.genre)) artistData.genres.push(t.genre);
        const albumId = t.albumId || t.album.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!artistData.albums.includes(albumId)) artistData.albums.push(albumId);
        await setDocDb('artists', artistId, artistData);

        // Write album to DB
        let albumData = await getDocDb('albums', albumId) || { id: albumId, name: t.album, artist: artistId, cover: coverFileUrl, year: t.year || new Date().getFullYear(), songs: [] as string[] };
        if (!albumData.songs.includes(trackId)) albumData.songs.push(trackId);
        await setDocDb('albums', albumId, albumData);

        // Write song to DB
        await setDocDb('songs', trackId, {
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
      }

      sendProgress(\`Progress: 100%\`);
      sendProgress(\`Processing complete! Added: \${stats.added}, Skipped: \${stats.skipped}, Errors: \${stats.errors}\`);
      
      // Cleanup
      await fsx.remove(extractDir);
      await fsx.remove(archivePath);
      flushAndEnd({ stats });
    } catch (err: any) {
      sendProgress(\`Fatal error: \${err.message}\`, true);
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

  `;

code = code.substring(0, startIndex) + newApiSection + code.substring(endIndex);
fs.writeFileSync('server.ts', code);
