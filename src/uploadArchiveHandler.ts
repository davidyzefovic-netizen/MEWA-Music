import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import AdmZip from "adm-zip";

const upload = multer({ dest: "temp_uploads/" });
export const uploadArchiveHandler = express.Router();

uploadArchiveHandler.post("/upload-archive", upload.single("archive"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No archive uploaded" });

  const tempDir = path.join("temp_uploads", "extracted_" + Date.now());
  const uploadsDir = path.join(process.cwd(), "uploads");
  const songsDir = path.join(uploadsDir, "songs");
  const artistsDir = path.join(uploadsDir, "artists");
  const albumsDir = path.join(uploadsDir, "albums");
  const globalIndexFile = path.join(uploadsDir, "songs.json");

  try {
    await fs.ensureDir(tempDir);
    await fs.ensureDir(songsDir);
    await fs.ensureDir(artistsDir);
    await fs.ensureDir(albumsDir);

    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(tempDir, true);

    let indexData: any[] = [];
    const indexFile = path.join(tempDir, "index.json");

    if (await fs.pathExists(indexFile)) {
      indexData = await fs.readJson(indexFile);
    } else {
      // Fallback: scan songs/ directory
      const songsFolder = path.join(tempDir, "songs");
      if (await fs.pathExists(songsFolder)) {
        // basic fallback scanning
        // (to be implemented properly if required, but user provided index.json structure)
      }
    }

    let globalIndex = { songs: [] as any[] };
    if (await fs.pathExists(globalIndexFile)) {
      globalIndex = await fs.readJson(globalIndexFile);
    }

    let added = 0, skipped = 0, errors = 0;

    for (const track of indexData) {
      try {
        const audioSource = path.join(tempDir, track.audioFile);
        if (!(await fs.pathExists(audioSource))) {
          errors++;
          continue;
        }

        const artistSongsDir = path.join(songsDir, track.artistId);
        await fs.ensureDir(artistSongsDir);
        
        // Track ID from index, or artistId-trackId
        const trackId = track.id || `${track.artistId}-${path.basename(track.audioFile, path.extname(track.audioFile))}`;
        
        const audioDest = path.join(artistSongsDir, `${trackId}.mp3`);
        await fs.copy(audioSource, audioDest);

        let coverDest = "";
        if (track.coverFile) {
          const coverSource = path.join(tempDir, track.coverFile);
          if (await fs.pathExists(coverSource)) {
            coverDest = path.join(artistSongsDir, `${trackId}.jpg`);
            await fs.copy(coverSource, coverDest);
          }
        }

        // Update artist JSON
        const artistJsonFile = path.join(artistsDir, `${track.artistId}.json`);
        let artistData = { id: track.artistId, name: track.artist, photo: "", bio: "", genres: [], albums: [], songs: [] as string[] };
        if (await fs.pathExists(artistJsonFile)) {
          artistData = await fs.readJson(artistJsonFile);
        }
        if (!artistData.songs.includes(trackId)) {
          artistData.songs.push(trackId);
        }
        if (track.albumId && !artistData.albums.includes(track.albumId)) {
          artistData.albums.push(track.albumId);
        }
        if (!artistData.genres.includes(track.genre) && track.genre) {
          artistData.genres.push(track.genre);
        }
        await fs.writeJson(artistJsonFile, artistData, { spaces: 2 });

        // Update album JSON
        if (track.albumId) {
          const albumJsonFile = path.join(albumsDir, `${track.albumId}.json`);
          let albumData = { id: track.albumId, name: track.album, artist: track.artistId, cover: "", year: track.year || 2024, songs: [] as string[] };
          if (await fs.pathExists(albumJsonFile)) {
            albumData = await fs.readJson(albumJsonFile);
          }
          if (!albumData.songs.includes(trackId)) {
            albumData.songs.push(trackId);
          }
          if (coverDest && !albumData.cover) {
            albumData.cover = `/uploads/songs/${track.artistId}/${trackId}.jpg`;
          }
          await fs.writeJson(albumJsonFile, albumData, { spaces: 2 });
        }

        // Add to global index
        const existingGlobal = globalIndex.songs.find(s => s.id === trackId);
        if (!existingGlobal) {
          globalIndex.songs.push({
            id: trackId,
            title: track.title,
            artist: track.artistId,
            album: track.albumId,
            audio: `/uploads/songs/${track.artistId}/${trackId}.mp3`,
            cover: coverDest ? `/uploads/songs/${track.artistId}/${trackId}.jpg` : "",
            lyrics: track.lyrics || "",
            genre: track.genre || "",
            tags: track.tags || [],
            year: track.year || new Date().getFullYear()
          });
          added++;
        } else {
          skipped++;
        }

      } catch (e) {
        errors++;
        console.error(e);
      }
    }

    await fs.writeJson(globalIndexFile, globalIndex, { spaces: 2 });

    // Cleanup
    await fs.remove(tempDir);
    await fs.remove(req.file.path);

    res.json({ added, skipped, errors, message: "Archive processed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process archive" });
  }
});
