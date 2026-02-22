const fs = require('fs');
const path = require('path');

const srcPath = 'e:/VibeCoding/Perpustakaan/src/app/barcode';
const destPath = 'e:/VibeCoding/LabIPA/src/app/perpus/barcode';

if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
}

if (fs.existsSync(srcPath)) {
    const files = fs.readdirSync(srcPath);
    for (const file of files) {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(path.join(srcPath, file), 'utf8');
            content = content.replace(/(['"`])\/api\/(?!auth|perpus)/g, "$1/api/perpus/");
            fs.writeFileSync(path.join(destPath, file), content);
            console.log(`Copied and updated ${file} into ${destPath}`);
        }
    }
} else {
    console.error('Source barcode folder not found!');
}
