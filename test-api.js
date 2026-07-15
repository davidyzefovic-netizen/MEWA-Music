fetch('http://localhost:3000/api/db/songs').then(r => r.text()).then(console.log).catch(console.error);
