const fs = require('fs');

let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

content = content.replace(/import \{ getFileUrl \} from "\.\.\/lib\/indexedDbStorage";\n/g, '');

const oldLoad = `    const loadAudio = async () => {
      const localUrl = await getFileUrl(currentSong.id, "audio");
      if (!active) return;

      audio.src = localUrl || currentSong.audioUrl || "";
      audio.load();`;

const newLoad = `    const loadAudio = async () => {
      if (!active) return;

      audio.src = currentSong.audioUrl || "";
      audio.load();`;

content = content.replace(oldLoad, newLoad);

// same for cover image if it uses getFileUrl for image
// let's check if it uses getFileUrl for image
fs.writeFileSync('src/components/AudioPlayer.tsx', content);

