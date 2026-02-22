const fs = require('fs');
const path = require('path');

const perpusSrc = 'e:/VibeCoding/Perpustakaan/src';
const targetSrc = 'e:/VibeCoding/LabIPA/src';

// 1. Copy Components
const componentsToCopy = ['BarcodeGenerator.tsx', 'IdCardModal.tsx', 'MemberHistoryModal.tsx'];
for (const comp of componentsToCopy) {
    if (fs.existsSync(path.join(perpusSrc, 'components', comp))) {
        let content = fs.readFileSync(path.join(perpusSrc, 'components', comp), 'utf8');
        // Replace API paths in components
        content = content.replace(/(['"`])\/api\/(?!auth|perpus)/g, "$1/api/perpus/");
        fs.writeFileSync(path.join(targetSrc, 'components', comp), content);
    }
}

// 2. Copy excelHelper as perpusExcelHelper
if (fs.existsSync(path.join(perpusSrc, 'lib', 'excelHelper.ts'))) {
    let content = fs.readFileSync(path.join(perpusSrc, 'lib', 'excelHelper.ts'), 'utf8');
    // Replace settings table with perpus_settings
    content = content.replace(/FROM settings/g, 'FROM perpus_settings');
    fs.writeFileSync(path.join(targetSrc, 'lib', 'perpusExcelHelper.ts'), content);
}

// 3. Update export routes to use perpusExcelHelper
function replaceExcelHelperImports(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceExcelHelperImports(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@/lib/excelHelper')) {
                content = content.replace(/@\/lib\/excelHelper/g, '@/lib/perpusExcelHelper');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceExcelHelperImports(path.join(targetSrc, 'app', 'api', 'perpus', 'export'));

console.log('Fixed Perpustakaan imports and copied perpusExcelHelper/components!');
