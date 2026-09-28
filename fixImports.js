const fs = require('fs');

function fix(file) {
  let text = fs.readFileSync(file, 'utf-8');
  // Replace ../../ components with ../../../
  text = text.replace(/\.\.\/\.\.\/components/g, '../../../components');
  text = text.replace(/\.\.\/\.\.\/api/g, '../../../api');
  text = text.replace(/\.\.\/\.\.\/context/g, '../../../context');
  text = text.replace(/\.\.\/\.\.\/utils/g, '../../../utils');
  text = text.replace(/\.\.\/\.\.\/hooks/g, '../../../hooks');
  text = text.replace(/\.\.\/\.\.\/theme/g, '../../../theme');
  fs.writeFileSync(file, text, 'utf-8');
}

fix('src/app/(tabs)/dashboard/index.tsx');
fix('src/app/(tabs)/settings/index.tsx');
console.log("Imports fixed!");
