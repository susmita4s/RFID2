const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const original = content;
  
  // Remove the old import
  content = content.replace(/const\s+\{\s*PrismaClient\s*\}\s*=\s*require\(['"]@prisma\/client['"]\);\s*/g, "");
  
  // Replace the instantiation with require
  content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\);\s*/g, "const prisma = require('../prismaClient');\n");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${file}`);
  }
});
