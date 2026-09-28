const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/dashboard.tsx', 'utf-8');

const regex = /<Text style=\{styles\.iconText\}>\{item\.icon\}<\/Text>/;
text = text.replace(regex, "<Ionicons name={item.icon as any} size={28} color={item.iconColor || '#4B5563'} />");

fs.writeFileSync('src/app/(tabs)/dashboard.tsx', text, 'utf-8');
console.log("Fixed icon");
