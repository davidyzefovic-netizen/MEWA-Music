const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldArtistWrite = `        // Write artist to DB
        let artistData = await getDocDb('artists', artistId) || { id: artistId, name: t.artist, photo: coverFileUrl, bio: "", genres: [] as string[], albums: [] as string[], songs: [] as string[] };
        if (!artistData.songs.includes(trackId)) artistData.songs.push(trackId);
        if (t.genre && !artistData.genres.includes(t.genre)) artistData.genres.push(t.genre);`;

const newArtistWrite = `        // Write artist to DB
        let artistData = await getDocDb('artists', artistId) || { id: artistId, name: t.artist, photoUrl: coverFileUrl, bio: "", genres: [] as string[], albums: [] as string[], songs: [] as string[] };
        
        // Try to find an artist-specific cover in the zip
        const artistCoverPathJpg = path.join(baseDir, "songs", \`\${artistId}-cover.jpg\`);
        const artistCoverPathPng = path.join(baseDir, "songs", \`\${artistId}-cover.png\`);
        
        if (fs.existsSync(artistCoverPathJpg)) {
            const destArtistCover = path.join(artistSongsDir, \`\${artistId}-cover.jpg\`);
            await fsx.copy(artistCoverPathJpg, destArtistCover);
            artistData.photoUrl = \`/uploads/songs/\${artistId}/\${artistId}-cover.jpg\`;
        } else if (fs.existsSync(artistCoverPathPng)) {
            const destArtistCover = path.join(artistSongsDir, \`\${artistId}-cover.png\`);
            await fsx.copy(artistCoverPathPng, destArtistCover);
            artistData.photoUrl = \`/uploads/songs/\${artistId}/\${artistId}-cover.png\`;
        } else if (!artistData.photoUrl || artistData.photoUrl.includes('unsplash.com')) {
            // Fallback to the track's cover
            artistData.photoUrl = coverFileUrl;
        }

        if (!artistData.songs.includes(trackId)) artistData.songs.push(trackId);
        if (t.genre && !artistData.genres.includes(t.genre)) artistData.genres.push(t.genre);`;

content = content.replace(oldArtistWrite, newArtistWrite);

// Also make sure album photo is photoUrl if needed, but it seems Artist has photoUrl, not photo
content = content.replace(/photo: coverFileUrl/g, "photoUrl: coverFileUrl");

fs.writeFileSync('server.ts', content);
