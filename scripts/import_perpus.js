const fs = require('fs');
const path = require('path');

const perpusSrc = 'e:/VibeCoding/Perpustakaan/src';
const targetSrc = 'e:/VibeCoding/LabIPA/src';

function copyFolderSync(from, to) {
    if (!fs.existsSync(from)) return;
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });

    const items = fs.readdirSync(from);
    for (const item of items) {
        const fromPath = path.join(from, item);
        const toPath = path.join(to, item);
        const stat = fs.statSync(fromPath);

        if (stat.isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else if (stat.isDirectory()) {
            copyFolderSync(fromPath, toPath);
        }
    }
}

// 1. Copy App Pages to /perpus
const pagesToCopy = ['books', 'members', 'loans', 'reservations', 'reports', 'settings', 'subjects', 'audit', 'scan'];
for (const page of pagesToCopy) {
    copyFolderSync(path.join(perpusSrc, 'app', page), path.join(targetSrc, 'app', 'perpus', page));
}

// 2. Copy API to /api/perpus
if (!fs.existsSync(path.join(targetSrc, 'app', 'api', 'perpus'))) {
    fs.mkdirSync(path.join(targetSrc, 'app', 'api', 'perpus'), { recursive: true });
}
copyFolderSync(path.join(perpusSrc, 'app', 'api'), path.join(targetSrc, 'app', 'api', 'perpus'));
if (fs.existsSync(path.join(targetSrc, 'app', 'api', 'perpus', 'auth'))) {
    fs.rmSync(path.join(targetSrc, 'app', 'api', 'perpus', 'auth'), { recursive: true, force: true });
}
if (fs.existsSync(path.join(targetSrc, 'app', 'api', 'perpus', 'cron'))) {
    fs.rmSync(path.join(targetSrc, 'app', 'api', 'perpus', 'cron'), { recursive: true, force: true });
}

// 3. Components
if (fs.existsSync(path.join(perpusSrc, 'components', 'Sidebar.tsx'))) {
    const sidebar = fs.readFileSync(path.join(perpusSrc, 'components', 'Sidebar.tsx'), 'utf8');
    fs.writeFileSync(path.join(targetSrc, 'components', 'PerpusSidebar.tsx'), sidebar);
}

// 4. Update the content of copied files:
// Replace /api/ with /api/perpus/
// Update imports if needed (usually @/components should still work)
function recursivelyProcessFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const itemPath = path.join(dir, item);
        if (fs.statSync(itemPath).isDirectory()) {
            recursivelyProcessFiles(itemPath);
        } else if (itemPath.endsWith('.tsx') || itemPath.endsWith('.ts')) {
            let content = fs.readFileSync(itemPath, 'utf8');
            let modified = false;

            // Replace /api/ to /api/perpus/ except for auth
            // This regex tries to find strings starting with /api/ except /api/auth and /api/perpus
            if (content.includes("'/api/")) {
                content = content.replace(/(['"`])\/api\/(?!auth|perpus)/g, "$1/api/perpus/");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(itemPath, content, 'utf8');
            }
        }
    }
}

recursivelyProcessFiles(path.join(targetSrc, 'app', 'perpus'));
recursivelyProcessFiles(path.join(targetSrc, 'app', 'api', 'perpus'));

// Custom adjustments for Sidebar
if (fs.existsSync(path.join(targetSrc, 'components', 'PerpusSidebar.tsx'))) {
    let sidebar = fs.readFileSync(path.join(targetSrc, 'components', 'PerpusSidebar.tsx'), 'utf8');
    // Rewrite hrefs to prefix with /perpus for navigation
    // The previous sidebar had items array. Let's look for href: '/...' -> href: '/perpus/...' except for exactly '/'
    sidebar = sidebar.replace(/href:\s*'(?!\/perpus)(?!\/$)([^']+)'/g, "href: '/perpus$1'");
    sidebar = sidebar.replace(/href:\s*'\/'/g, "href: '/perpus'");

    // Check if it fetches /api/settings to /api/perpus/settings
    sidebar = sidebar.replace(/\/api\/settings/g, "/api/perpus/settings");
    sidebar = sidebar.replace(/\/api\/auth/g, "/api/auth"); // restore auth if changed

    fs.writeFileSync(path.join(targetSrc, 'components', 'PerpusSidebar.tsx'), sidebar, 'utf8');
}

console.log('Copy complete!');
