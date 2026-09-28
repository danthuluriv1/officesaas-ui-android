const fs = require('fs');

let text = fs.readFileSync('src/app/(tabs)/dashboard.tsx', 'utf-8');

const regex = /const DEFAULT_SHORTCUTS: ShortcutConfig\[\] = \[[\s\S]*?\];/;

const newShortcuts = `const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'inbox', title: 'Inbox', icon: 'mail', bgColor: '#DBEAFE', iconColor: '#1D4ED8', route: '/(tabs)/modules/inbox', showBadge: true },
  { id: 'workspace', title: 'Workspace', icon: 'chatbubbles', bgColor: '#F3E8FF', iconColor: '#7E22CE', route: '/(tabs)/modules/workspace' },
  { id: 'addExpense', title: 'Add Expense', icon: 'add-circle-outline', bgColor: '#FEE2E2', iconColor: '#B91C1C', route: '/(tabs)/modules/finance', params: { action: 'addExpense' } },
  { id: 'postPayment', title: 'Post Payment', icon: 'arrow-down-circle-outline', bgColor: '#D1FAE5', iconColor: '#047857', route: '/(tabs)/modules/finance', params: { action: 'addPayment' } },
  { id: 'attendance', title: 'Attendance', icon: 'time', bgColor: '#E0F2FE', iconColor: '#0369A1', route: '/(tabs)/modules/attendance' },
  { id: 'directory', title: 'Directory', icon: 'id-card', bgColor: '#FEF3C7', iconColor: '#B45309', route: '/(tabs)/modules/directory' },
];`;

text = text.replace(regex, newShortcuts);

const iconPropRegex = /icon: string;/;
text = text.replace(iconPropRegex, "icon: string;\n  iconColor?: string;");

const renderIconRegex = /<Text style=\{styles\.shortcutIcon\}>\{shortcut\.icon\}<\/Text>/;
const renderIconNew = `<Ionicons name={shortcut.icon as any} size={28} color={shortcut.iconColor || '#4B5563'} />`;
text = text.replace(renderIconRegex, renderIconNew);

if (!text.includes("import { Ionicons }")) {
    text = text.replace("import { AppText", "import { Ionicons } from '@expo/vector-icons';\nimport { AppText");
}

fs.writeFileSync('src/app/(tabs)/dashboard.tsx', text, 'utf-8');
console.log("Dashboard updated");
