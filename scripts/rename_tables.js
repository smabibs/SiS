const fs = require('fs');
const path = require('path');

const targetDirs = [
    'e:/VibeCoding/LabIPA/src/app/api/perpus',
    'e:/VibeCoding/LabIPA/src/app/perpus',
    'e:/VibeCoding/LabIPA/src/components' // to check for PerpusSidebar etc
];

const tables = [
    'books',
    'members',
    'loans',
    'subjects',
    'categories',
    'reservations',
    'tags',
    'book_tags',
    'audit_logs',
    'settings'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern for table name replacement inside likely SQL or API routes
    // Only replacing when table names are preceded by FROM, INTO, UPDATE, JOIN, TABLE, or references like books.id
    for (const table of tables) {
        // SQL keywords
        const regexKeywords = new RegExp(`\\b(FROM|INTO|UPDATE|JOIN|TABLE)\\s+${table}\\b`, 'gi');
        if (regexKeywords.test(content)) {
            content = content.replace(regexKeywords, (match, keyword) => `${keyword} perpus_${table}`);
            modified = true;
        }

        // Table aliases or direct field access (e.g. books.id, books.title)
        const regexAlias = new RegExp(`\\b${table}\\.(id|title|isbn|name|member_id|book_id|status|total_copies|available_copies|created_at|updated_at)\\b`, 'g');
        if (regexAlias.test(content)) {
            content = content.replace(regexAlias, `perpus_${table}.$1`);
            modified = true;
        }

        // Specific cases like `loans l` -> `perpus_loans l` might have been caught by FROM/JOIN, but let's check
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

for (const dir of targetDirs) {
    processDirectory(dir);
}

console.log('Table names renamed in SQL queries!');
