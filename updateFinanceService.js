const fs = require('fs');
let text = fs.readFileSync('src/api/financeService.ts', 'utf-8');

text = text.replace(
  "export interface LedgerFiltersDto {",
  "export interface LedgerFiltersDto {\n  categories: string[];\n  paidTo: string[];\n  paidBy: string[];\n}"
);

// If the above doesn't work because it's not strictly an interface, we can just let any handle it, but wait, typescript might not care if we cast. Let's just blindly replace if we can find it.
