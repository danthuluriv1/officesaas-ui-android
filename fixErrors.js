const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

function replaceInFile(relativePath, replacements) {
    const filePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const { search, replace } of replacements) {
        if (typeof search === 'string') {
            if (content.includes(search)) {
                content = content.replaceAll(search, replace);
                modified = true;
            }
        } else if (search instanceof RegExp) {
            if (search.test(content)) {
                content = content.replace(search, replace);
                modified = true;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', relativePath);
    }
}

// Fix _value access
const cardFiles = [
    'src/components/clients/ClientCard.tsx',
    'src/components/directory/EmployeeCard.tsx',
    'src/components/documents/DocumentCard.tsx',
    'src/components/vendors/VendorCard.tsx'
];

cardFiles.forEach(file => {
    replaceInFile(file, [
        { search: /scaleAnim\._value/g, replace: '(scaleAnim as any)._value' },
        { search: 'Theme.colors.borderLight', replace: 'Theme.colors.border' },
        { search: 'Theme.colors.textMuted', replace: 'Theme.colors.textSecondary' },
        { search: 'Theme.colors.text,', replace: 'Theme.colors.textPrimary,' },
        { search: 'Theme.colors.text}', replace: 'Theme.colors.textPrimary}' },
        { search: 'Theme.colors.text ', replace: 'Theme.colors.textPrimary ' },
    ]);
});

replaceInFile('src/components/documents/UploadDocumentModal.tsx', [
    { search: 'Theme.colors.text,', replace: 'Theme.colors.textPrimary,' },
    { search: 'Theme.colors.text}', replace: 'Theme.colors.textPrimary}' }
]);

replaceInFile('src/components/ui/PhoneNumberInput.tsx', [
    // Add disabled?: boolean; to interface
    { 
        search: /interface PhoneNumberInputProps \{/, 
        replace: 'interface PhoneNumberInputProps {\n  disabled?: boolean;' 
    },
    // Fix cursor typing error (cursor: 'not-allowed')
    { 
        search: /cursor:\s*disabled\s*\?\s*['"]not-allowed['"]\s*:\s*['"]text['"]/g, 
        replace: "cursor: (disabled ? 'not-allowed' : 'text') as any" 
    },
    { 
        search: /cursor:\s*['"]text['"]/g, 
        replace: "cursor: 'text' as any" 
    }
]);

console.log('Done fixing errors.');
