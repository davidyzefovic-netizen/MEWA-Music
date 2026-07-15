const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldArtistWrite = `        // Write artist to DB
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

const newArtistWrite = `        // Write artist to DB
        let artistData = await getDocDb('artists', artistId);
        if (!artistData) {
            artistData = { id: artistId, name: t.artist, imageUrl: coverFileUrl, bio: "", createdBy: "admin", createdAt: new Date().toISOString() };
        }
        
        // Ensure arrays exist
        artistData.songs = artistData.songs || [];
        artistData.genres = artistData.genres || [];
        artistData.albums = artistData.albums || [];

        // Try to find an artist-specific cover in the zip
        const artistCoverPathJpg = path.join(baseDir, "songs", \`\${artistId}-cover.jpg\`);
        const artistCoverPathPng = path.join(baseDir, "songs", \`\${artistId}-cover.png\`);
        
        if (fs.existsSync(artistCoverPathJpg)) {
            const destArtistCover = path.join(artistSongsDir, \`\${artistId}-cover.jpg\`);
            await fsx.copy(artistCoverPathJpg, destArtistCover);
            artistData.imageUrl = \`/uploads/songs/\${artistId}/\${artistId}-cover.jpg\`;
        } else if (fs.existsSync(artistCoverPathPng)) {
            const destArtistCover = path.join(artistSongsDir, \`\${artistId}-cover.png\`);
            await fsx.copy(artistCoverPathPng, destArtistCover);
            artistData.imageUrl = \`/uploads/songs/\${artistId}/\${artistId}-cover.png\`;
        } else if (!artistData.imageUrl || artistData.imageUrl.includes('unsplash.com')) {
            // Fallback to the track's cover
            artistData.imageUrl = coverFileUrl;
        }

        if (!artistData.songs.includes(trackId)) artistData.songs.push(trackId);
        if (t.genre && !artistData.genres.includes(t.genre)) artistData.genres.push(t.genre);`;

content = content.replace(oldArtistWrite, newArtistWrite);

const oldAlbumWrite = `        // Write album to DB
        let albumData = await getDocDb('albums', albumId) || { id: albumId, name: t.album, artist: artistId, cover: coverFileUrl, year: t.year || new Date().getFullYear(), songs: [] as string[] };
        if (!albumData.songs.includes(trackId)) albumData.songs.push(trackId);
        await setDocDb('albums', albumId, albumData);`;

const newAlbumWrite = `        // Write album to DB
        let albumData = await getDocDb('albums', albumId);
        if (!albumData) {
            albumData = { id: albumId, title: t.album, artistId: artistId, artistName: t.artist, coverUrl: coverFileUrl, releaseYear: String(t.year || new Date().getFullYear()), createdBy: "admin", createdAt: new Date().toISOString() };
        }
        albumData.songs = albumData.songs || [];
        if (!albumData.songs.includes(trackId)) albumData.songs.push(trackId);
        await setDocDb('albums', albumId, albumData);`;

content = content.replace(oldAlbumWrite, newAlbumWrite);

fs.writeFileSync('server.ts', content);
