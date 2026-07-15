const fs = require('fs');
let content = fs.readFileSync('src/components/AuthorPanel.tsx', 'utf8');

const newUploadSubmit = `  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !artist.trim() || !lyrics.trim() || (!audioFile && !audioUrl.trim())) {
      setError("Please fill in all mandatory fields: Title, Artist, Lyrics, and Audio file or stream URL.");
      return;
    }

    setSubmitting(true);
    try {
      const genresArray = genres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "");
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");
      const featuredArtistsArray = featuredArtists
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a !== "");

      let finalAudioUrl = audioUrl;
      let finalCoverUrl = coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400";

      if (audioFile) {
        finalAudioUrl = await uploadFileToServer(audioFile);
      }
      if (coverFile) {
        finalCoverUrl = await uploadFileToServer(coverFile);
      } else if (coverPreview && !coverPreview.startsWith('data:')) {
         finalCoverUrl = coverPreview;
      }

      // Call parent creator to upload and return the new song's ID
      const songId = await onUploadSong({
        title,
        artist,
        featuredArtists: featuredArtistsArray,
        album,
        lyrics,
        audioUrl: finalAudioUrl,
        coverUrl: finalCoverUrl,
        genres: genresArray.length > 0 ? genresArray : ["Electronic"],
        tags: tagsArray,
      });

      // Clear states
      setTitle("");
      setAlbum("");
      setAudioUrl("");
      setCoverUrl("");
      setCoverPreview("");
      setAudioFile(null);
      setCoverFile(null);
      setGenres("");
      setTags("");
      setLyrics("");
      setUploadMode("none");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };`;

const newEditSubmit = `  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;

    setSubmitting(true);
    try {
      let finalCover = editCoverUrl;
      let finalAudio = editingSong.audioUrl;

      if (editCoverFile) {
        finalCover = await uploadFileToServer(editCoverFile);
      } else if (editCoverPreview && !editCoverPreview.startsWith('data:')) {
        finalCover = editCoverPreview;
      }

      if (editAudioFile) {
         finalAudio = await uploadFileToServer(editAudioFile);
      }
      
      await onEditSong(editingSong.id, {
        title: editTitle,
        album: editAlbum,
        lyrics: editLyrics,
        coverUrl: finalCover,
        audioUrl: finalAudio,
      });

      setEditingSong(null);
      setEditAudioFile(null);
      setEditCoverFile(null);
      setEditCoverPreview("");
    } catch (err) {
      console.error("Failed to edit track: ", err);
    } finally {
      setSubmitting(false);
    }
  };`;

content = content.replace(/const handleUploadSubmit = async \([\s\S]*?setSubmitting\(false\);\n    }\n  };/, newUploadSubmit);
content = content.replace(/const handleEditSubmit = async \([\s\S]*?setSubmitting\(false\);\n    }\n  };/, newEditSubmit);

fs.writeFileSync('src/components/AuthorPanel.tsx', content);

