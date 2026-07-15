const fs = require('fs');
let content = fs.readFileSync('src/components/ArtistProfilePage.tsx', 'utf8');

const uploadHelper = `
const uploadFileToServer = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};
`;

content = content.replace(/import \{ compressImage \} from "\.\.\/lib\/indexedDbStorage";\n/g, uploadHelper);

content = content.replace(/const handleImageChange = async \(file: File\) => {[\s\S]*?};/, `const handleImageChange = async (file: File) => {
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };`);

content = content.replace(/const handleBannerChange = async \(file: File\) => {[\s\S]*?};/, `const handleBannerChange = async (file: File) => {
    setEditBannerFile(file);
    setEditBannerPreview(URL.createObjectURL(file));
  };`);

content = content.replace(/const handleAlbumCoverChange = async \(file: File\) => {[\s\S]*?};/, `const handleAlbumCoverChange = async (file: File) => {
    try {
      const url = await uploadFileToServer(file);
      setNewAlbumCover(url);
    } catch(e) { console.error(e); }
  };`);

// Update handleSave to upload images
const oldHandleSave = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const genresArray = editGenres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "");
      let finalPhoto = editImagePreview || editPhotoUrl;
      let finalBanner = editBannerPreview || editBannerUrl;
      await onUpdateArtist(artist.id, {
        name: editName,
        bio: editBio,
        genres: genresArray,
        photoUrl: finalPhoto,
        bannerUrl: finalBanner,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };`;

const newHandleSave = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const genresArray = editGenres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "");
      
      let finalPhoto = editPhotoUrl;
      let finalBanner = editBannerUrl;
      
      if (editImageFile) {
        finalPhoto = await uploadFileToServer(editImageFile);
      }
      if (editBannerFile) {
        finalBanner = await uploadFileToServer(editBannerFile);
      }
      
      await onUpdateArtist(artist.id, {
        name: editName,
        bio: editBio,
        genres: genresArray,
        photoUrl: finalPhoto,
        bannerUrl: finalBanner,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };`;

content = content.replace(oldHandleSave, newHandleSave);

fs.writeFileSync('src/components/ArtistProfilePage.tsx', content);
