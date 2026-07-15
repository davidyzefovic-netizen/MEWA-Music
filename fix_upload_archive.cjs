const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldIndexCheck = `      const indexJsonPath = path.join(extractDir, "index.json");
      let tracks: any[] = [];
      if (fs.existsSync(indexJsonPath)) {
        sendProgress("Found index.json, using as primary data source.");
        tracks = await fsx.readJson(indexJsonPath);
      }`;

const newIndexCheck = `      let indexJsonPath = path.join(extractDir, "index.json");
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
      }`;

content = content.replace(oldIndexCheck, newIndexCheck);

const oldAudioFilePath = `        const audioFilePath = path.join(extractDir, t.audioFile);`;
const newAudioFilePath = `        // Adjust paths if index.json was nested
        const baseDir = path.dirname(indexJsonPath);
        const audioFilePath = path.join(baseDir, t.audioFile);`;
content = content.replace(oldAudioFilePath, newAudioFilePath);

const oldCoverFilePath = `          const coverFilePath = path.join(extractDir, t.coverFile);`;
const newCoverFilePath = `          const coverFilePath = path.join(baseDir, t.coverFile);`;
content = content.replace(oldCoverFilePath, newCoverFilePath);


fs.writeFileSync('server.ts', content);
