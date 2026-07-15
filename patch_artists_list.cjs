const fs = require('fs');
let content = fs.readFileSync('src/components/ArtistsList.tsx', 'utf8');

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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };`);

content = content.replace(/const handleBannerChange = async \(file: File\) => {[\s\S]*?};/, `const handleBannerChange = async (file: File) => {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };`);

const oldSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Artist name is required");
      return;
    }

    setSubmitting(true);
    try {
      const genresArray = genres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "");

      const artistId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      let finalPhoto = imagePreview || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800";
      let finalBanner = bannerPreview || "https://images.unsplash.com/photo-1493225457124-a1a2a5f5646f?w=1600";

      await onCreateArtistProfile({
        id: artistId,
        name: name.trim(),
        bio: bio.trim(),
        photoUrl: finalPhoto,
        bannerUrl: finalBanner,
        genres: genresArray,
        songs: [],
        albums: [],
      });

      setShowCreateModal(false);
      // Reset form
      setName("");
      setBio("");
      setGenres("");
      setImageFile(null);
      setBannerFile(null);
      setImagePreview("");
      setBannerPreview("");
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };`;

const newSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Artist name is required");
      return;
    }

    setSubmitting(true);
    try {
      const genresArray = genres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== "");

      const artistId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      let finalPhoto = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800";
      let finalBanner = "https://images.unsplash.com/photo-1493225457124-a1a2a5f5646f?w=1600";

      if (imageFile) finalPhoto = await uploadFileToServer(imageFile);
      if (bannerFile) finalBanner = await uploadFileToServer(bannerFile);

      await onCreateArtistProfile({
        id: artistId,
        name: name.trim(),
        bio: bio.trim(),
        photoUrl: finalPhoto,
        bannerUrl: finalBanner,
        genres: genresArray,
        songs: [],
        albums: [],
      });

      setShowCreateModal(false);
      // Reset form
      setName("");
      setBio("");
      setGenres("");
      setImageFile(null);
      setBannerFile(null);
      setImagePreview("");
      setBannerPreview("");
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };`;

content = content.replace(oldSubmit, newSubmit);
fs.writeFileSync('src/components/ArtistsList.tsx', content);

