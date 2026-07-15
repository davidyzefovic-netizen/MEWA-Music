const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("const [field, op, value] = req.query.where.split(':');", "const [field, op, value] = (req.query.where as string).split(':');");
content = content.replace("if (v && typeof v === 'object' && v._increment) {", "if (v && typeof v === 'object' && (v as any)._increment) {");
content = content.replace("newObj[k] = (newObj[k] || 0) + v._increment;", "newObj[k] = (newObj[k] || 0) + (v as any)._increment;");

fs.writeFileSync('server.ts', content);
