const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  '  app.listen(PORT, "0.0.0.0", () => {\n    console.log(`Server running on http://0.0.0.0:${PORT}`);\n  });',
  `  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://0.0.0.0:\${PORT}\`);
  });
  server.keepAliveTimeout = 300000;
  server.headersTimeout = 305000;
  server.timeout = 300000;`
);

fs.writeFileSync('server.ts', content);
