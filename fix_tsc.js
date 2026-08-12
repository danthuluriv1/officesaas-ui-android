const fs = require('fs');

const hooks = [
  'src/api/hooks/useClientQueries.ts',
  'src/api/hooks/useDriverQueries.ts',
  'src/api/hooks/useInventoryQueries.ts',
  'src/api/hooks/useOfficeQueries.ts',
  'src/api/hooks/useVendorQueries.ts'
];

hooks.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import (\w+) from '([^']+)'/, "import { $1 } from '$2'");
  fs.writeFileSync(file, content);
});

const screens = [
  'src/app/(tabs)/modules/clients.tsx',
  'src/app/(tabs)/modules/vendors.tsx',
  'src/app/(tabs)/modules/inventory.tsx'
];

screens.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/onRefresh=\{\(\) => \{ setRefreshing\(true\); (fetch[a-zA-Z]*)\(\); \}\}/g, 'onRefresh={() => $1()}');
  if (file.includes('clients.tsx')) {
    content = content.replace(/clients\.filter\(client =>/g, 'clients.filter((client: any) =>');
  }
  if (file.includes('vendors.tsx')) {
    content = content.replace(/vendors\.filter\(vendor =>/g, 'vendors.filter((vendor: any) =>');
  }
  if (file.includes('inventory.tsx')) {
    content = content.replace(/stockLevels\.filter\(item =>/g, 'stockLevels.filter((item: any) =>');
  }
  fs.writeFileSync(file, content);
});

let myOffice = fs.readFileSync('src/app/(tabs)/modules/my-office.tsx', 'utf8');
myOffice = myOffice.replace(/setRefreshing\(true\);/g, '');
if (!myOffice.includes('import { useEffect')) {
  myOffice = myOffice.replace(/import React, \{ useCallback, useState \} from 'react';/, "import React, { useCallback, useState, useEffect } from 'react';");
}
fs.writeFileSync('src/app/(tabs)/modules/my-office.tsx', myOffice);

let drivers = fs.readFileSync('src/app/(tabs)/modules/drivers.tsx', 'utf8');
drivers = drivers.replace(/setRefreshing\(true\);/g, '');
drivers = drivers.replace(/fetchRoutes\(filterDate\)/g, 'fetchRoutes()');
fs.writeFileSync('src/app/(tabs)/modules/drivers.tsx', drivers);
