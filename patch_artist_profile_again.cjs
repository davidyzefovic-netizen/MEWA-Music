const fs = require('fs');
let content = fs.readFileSync('src/components/ArtistProfilePage.tsx', 'utf8');

const newHandleSave = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      let finalImage = editImagePreview;
      let finalBanner = editBannerPreview;

      if (editImageFile) {
         finalImage = await uploadFileToServer(editImageFile);
      }
      if (editBannerFile) {
         finalBanner = await uploadFileToServer(editBannerFile);
      }

      await onUpdateArtist(artist.id, {
        name: editName.trim(),
        bio: editBio.trim(),
        hometown: editHometown.trim(),
        formedIn: editFormedIn.trim(),
        imageUrl: finalImage,
        bannerUrl: finalBanner,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };`;

content = content.replace(/const handleSave = async \(e: React\.FormEvent\) => \{[\s\S]*?setSubmitting\(false\);\n    \}\n  \};/, newHandleSave);
fs.writeFileSync('src/components/ArtistProfilePage.tsx', content);
