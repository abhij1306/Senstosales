const fs = require('fs');
const path = require('path');

// Configuration
const TOKENS_DIR = path.join(__dirname, '../tokens');
const OUTPUT_FILE = path.join(__dirname, '../frontend/app/tokens.css');

// Helper: Deep merge objects
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        } else {
            Object.assign(target, { [key]: source[key] });
        }
    }
    return target;
}

// Helper: Flatten object to dash-case keys and values
// Returns array of { key: 'color-slate-50', value: '#f8fafc' }
function flattenTokens(obj, prefix = '', tokens = {}) {
    for (const key in obj) {
        if (key === 'value') continue; // Skip actual value keys when recursing

        const newKey = prefix ? `${prefix}-${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if ('value' in obj[key]) {
                // It's a token
                tokens[newKey] = obj[key].value;
            } else {
                // It's a group
                flattenTokens(obj[key], newKey, tokens);
            }
        }
    }
    return tokens;
}

// Helper: Resolve references {color.slate.50} recursively
function resolveReferences(value, allTokens) {
    if (typeof value !== 'string') return value;

    const refRegex = /\{([^}]+)\}/g;
    return value.replace(refRegex, (match, tokenPath) => {
        // Convert dot.path to dash-case-key
        const dashKey = tokenPath.replace(/\./g, '-');
        if (allTokens[dashKey]) {
            return resolveReferences(allTokens[dashKey], allTokens);
        }
        console.warn(`Warning: Could not resolve reference ${match}`);
        return match;
    });
}

// Main Build Process
console.log('🏗️  Building Design Tokens...');

try {
    // 1. Load JSONs
    const globalTokens = require(path.join(TOKENS_DIR, 'global.json'));
    const semanticTokens = require(path.join(TOKENS_DIR, 'semantic.json'));
    const componentTokens = require(path.join(TOKENS_DIR, 'component.json'));

    // 2. Flatten all tokens into a single map [key] -> value
    // Order matters for reference resolution: Global -> Semantic -> Component
    let flatMap = {};

    // Flatten Global
    const flatGlobal = flattenTokens(globalTokens);
    flatMap = { ...flatMap, ...flatGlobal };

    // Flatten Semantic
    const flatSemantic = flattenTokens(semanticTokens);
    flatMap = { ...flatMap, ...flatSemantic };

    // Flatten Component
    const flatComponent = flattenTokens(componentTokens);
    flatMap = { ...flatMap, ...flatComponent };

    // 3. Resolve References (Multi-pass to handle nested refs)
    let changed = true;
    let maxPasses = 5;
    while (changed && maxPasses > 0) {
        changed = false;
        for (const key in flatMap) {
            const original = flatMap[key];
            const resolved = resolveReferences(original, flatMap);
            if (original !== resolved) {
                flatMap[key] = resolved;
                changed = true;
            }
        }
        maxPasses--;
    }

    // 4. Generate CSS Content
    let cssContent = '/* Auto-generated Design Tokens - DO NOT EDIT */\n';
    cssContent += '@theme {\n';

    // We want to expose these as CSS variables but also hook into Tailwind theme if possible.
    // In v4, defining --color-slate-50 in @theme makes it available as utility.
    // However, @theme variables need specific names like --color-*.

    // Strategy:
    // 1. Primitive Colors -> --color-*
    // 2. Semantic Colors -> --color-* (e.g. --color-sys-bg-primary)
    // 3. Spacing -> --spacing-*
    // 4. Radius -> --radius-*
    // 5. Fonts -> --font-*

    // We need to categorize based on the prefix.

    const categorized = {
        color: [],
        font: [],
        radius: [],
        spacing: [],
        others: []
    };

    for (const key in flatMap) {
        const value = flatMap[key];
        // Heuristic: Check key name for category
        if (key.includes('color') || key.endsWith('-bg') || key.endsWith('-text') || key.endsWith('-border')) {
            categorized.color.push({ key, value });
        }
        else if (key.includes('font') || key.includes('type')) categorized.font.push({ key, value });
        else if (key.includes('radius')) categorized.radius.push({ key, value });
        else if (key.includes('spacing')) categorized.spacing.push({ key, value });
        else categorized.others.push({ key, value });
    }

    // Helper to format line
    const dim = (k, v) => `  --${k}: ${v};\n`;

    // Write Colors
    // Tailwind v4 requires --color-* for color utilities.
    categorized.color.forEach(({ key, value }) => {
        let finalKey = key;
        if (!finalKey.startsWith('color-')) {
            finalKey = 'color-' + finalKey;
        }
        cssContent += dim(finalKey, value);
    });

    // Fonts
    // Key: font-sans -> --font-sans
    categorized.font.forEach(({ key, value }) => {
        let finalKey = key;
        if (!finalKey.startsWith('font-')) {
            finalKey = 'font-' + finalKey;
        }
        cssContent += dim(finalKey, value);
    });

    // Radius
    // Key: radius-sm -> --radius-sm
    categorized.radius.forEach(({ key, value }) => {
        let finalKey = key;
        if (!finalKey.startsWith('radius-')) {
            finalKey = 'radius-' + finalKey;
        }
        cssContent += dim(finalKey, value);
    });

    // Spacing
    // Key: spacing-4 -> --spacing-4
    categorized.spacing.forEach(({ key, value }) => {
        let finalKey = key;
        if (!finalKey.startsWith('spacing-')) {
            finalKey = 'spacing-' + finalKey;
        }
        cssContent += dim(finalKey, value);
    });

    cssContent += '}\n\n';

    // For others (effects, etc that might not map strictly to theme buckets), put in :root
    cssContent += ':root {\n';
    categorized.others.forEach(({ key, value }) => cssContent += dim(key, value));
    cssContent += '}\n';

    // 5. Write File
    fs.writeFileSync(OUTPUT_FILE, cssContent);
    console.log(`✅ Tokens generated at ${OUTPUT_FILE}`);
    console.log(`   Count: ${Object.keys(flatMap).length} tokens`);

} catch (e) {
    console.error('❌ Build Failed:', e);
    process.exit(1);
}
