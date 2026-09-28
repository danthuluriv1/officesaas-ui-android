const fs = require('fs');

let text = fs.readFileSync('src/app/(tabs)/modules/index.tsx', 'utf-8');

const modulesRegex = /const modules = \[[\s\S]*?\];/;

const newModules = `const modules = [
  { id: 'clients', title: 'Clients', description: 'Manage client profiles and details', icon: 'people', color: '#FEE2E2', iconColor: '#B91C1C' },
  { id: 'vendors', title: 'Vendors', description: 'Manage vendor profiles and details', icon: 'business', color: '#FEF08A', iconColor: '#A16207' },
  { id: 'directory', title: 'Staff Directory', description: 'Manage employee profiles and roles', icon: 'id-card', color: '#DBEAFE', iconColor: '#1D4ED8' },
  { id: 'inventory', title: 'Inventory', description: 'Track stock levels and stock items', icon: 'cube', color: '#FEF3C7', iconColor: '#B45309' },
  { id: 'products', title: 'Products', description: 'Manage your product catalog', icon: 'pricetags', color: '#E0E7FF', iconColor: '#4338CA' },
  { id: 'orders', title: 'Orders', description: 'View and manage sales orders', icon: 'cart', color: '#DCFCE7', iconColor: '#15803D' },
  { id: 'finance', title: 'Finance', description: 'Access financial ledgers and accounting', icon: 'wallet', color: '#FCE7F3', iconColor: '#BE185D' },
  { id: 'attendance', title: 'Attendance', description: 'Log time and view attendance records', icon: 'time', color: '#E0F2FE', iconColor: '#0369A1' },
  { id: 'inbox', title: 'Inbox', description: 'View and manage incoming messages', icon: 'mail', color: '#EDE9FE', iconColor: '#6D28D9' },
  { id: 'workspace', title: 'Team Workspace', description: 'Collaborate with your team', icon: 'chatbubbles', color: '#F3E8FF', iconColor: '#7E22CE' },
  { id: 'transportation', title: 'Transportation', description: 'Manage vehicles and optimize delivery paths', icon: 'bus', color: '#DCFCE7', iconColor: '#15803D' },
  { id: 'drivers', title: 'Drivers', description: 'View assigned active routes and navigate', icon: 'navigate', color: '#EFF6FF', iconColor: '#1D4ED8' },
  { id: 'my-office', title: 'My Office', description: 'Manage office profile and settings', icon: 'settings', color: '#E0E7FF', iconColor: '#4338CA' },
  { id: 'documents', title: 'Documents', description: 'Store and search documents', icon: 'document-text', color: '#FEF3C7', iconColor: '#B45309' },
];`;

text = text.replace(modulesRegex, newModules);

const renderIconRegex = /<Text style=\{styles\.icon\}>\{mod\.icon\}<\/Text>/;
const renderIconNew = `<Ionicons name={mod.icon as any} size={28} color={mod.iconColor} />`;
text = text.replace(renderIconRegex, renderIconNew);

if (!text.includes("import { Ionicons }")) {
    text = text.replace("import { getItem }", "import { Ionicons } from '@expo/vector-icons';\nimport { getItem }");
}

fs.writeFileSync('src/app/(tabs)/modules/index.tsx', text, 'utf-8');
console.log("Modules screen updated");
