const fs = require('fs');
let text = fs.readFileSync('src/app/(tabs)/dashboard.tsx', 'utf-8');

const regex2 = /<Text style=\{styles\.reorderBtnText\}>[\s\S]*?Reorder<\/Text>/;
text = text.replace(regex2, "<View style={{flexDirection: 'row', alignItems: 'center'}}><Ionicons name=\"options\" size={16} color=\"#4338CA\" /><Text style={[styles.reorderBtnText, {marginLeft: 4}]}>Reorder</Text></View>");

fs.writeFileSync('src/app/(tabs)/dashboard.tsx', text, 'utf-8');
console.log("Fixed reorder");
