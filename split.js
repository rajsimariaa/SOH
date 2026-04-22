const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
    fs.writeFileSync('styles.css', styleMatch[1].trim());
    content = content.replace(styleMatch[0], '<link rel="stylesheet" href="styles.css">');
}

const scriptMatch = content.match(/<script type="text\/babel" data-type="module" data-presets="react">([\s\S]*?)<\/script>/);
if (scriptMatch) {
    let jsContent = scriptMatch[1].trim();

    // We should also separate the database config to db.js
    // Look for firebaseConfig
    const firebaseConfigRegex = /const firebaseConfig = {[\s\S]*?measurementId: "[^"]*"\s*};/;
    const initRegex = /const app = initializeApp\(firebaseConfig\);\s*const auth = getAuth\(app\);\s*const db = getFirestore\(app\);/;

    const configMatch = jsContent.match(firebaseConfigRegex);
    const initMatch = jsContent.match(initRegex);

    if (configMatch && initMatch) {
        let dbJs = `import { initializeApp } from 'firebase/app';\nimport { getAuth } from 'firebase/auth';\nimport { getFirestore } from 'firebase/firestore';\n\n`;
        dbJs += configMatch[0] + '\n\n';
        dbJs += `const app = initializeApp(firebaseConfig);\nexport const auth = getAuth(app);\nexport const db = getFirestore(app);\n`;
        fs.writeFileSync('db.js', dbJs);

        // Remove config and init from jsContent
        jsContent = jsContent.replace(configMatch[0], '');
        jsContent = jsContent.replace(initMatch[0], `import { auth, db } from './db.js';`);
    }

    fs.writeFileSync('app.jsx', jsContent);
    content = content.replace(scriptMatch[0], '<script type="text/babel" data-type="module" data-presets="react" src="app.jsx"></script>');
}

fs.writeFileSync('index.html', content);
console.log('Done!');
