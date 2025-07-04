const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

function cleanOldMetadata() {
    const objectDir = path.join(__dirname, '../../force-app/main/default/objects');
    const profileDir = path.join(__dirname, '../../force-app/main/default/profiles');
    const permSetDir = path.join(__dirname, '../../force-app/main/default/permissionsets');

    if (fs.existsSync(objectDir)) {
        fs.readdirSync(objectDir).forEach(file => {
            fs.rmSync(path.join(objectDir, file), { recursive: true, force: true });
        });
    }

    if (fs.existsSync(profileDir)) {
        fs.readdirSync(profileDir).forEach(file => {
            if (file.endsWith('.profile-meta.xml')) {
                fs.unlinkSync(path.join(profileDir, file));
            }
        });
    }

    if (fs.existsSync(permSetDir)) {
        fs.readdirSync(permSetDir).forEach(file => {
            if (file.endsWith('.permissionset-meta.xml')) {
                fs.unlinkSync(path.join(permSetDir, file));
            }
        });
    }

    console.log('🧹 Cleaned old object, profile, and permission set metadata');
}

function pushToGitHubDeployRepo() {
    const workingDir = path.resolve(__dirname, '../../');
    const repoUrl = `https://${process.env.GITHUB_TOKEN}@github.com/Neelava9681/Ai_Agent_Deploy.git`;

    try {
        execSync('git init', { cwd: workingDir });
        execSync('git add .', { cwd: workingDir });
        execSync('git config user.name "RenderBot"', { cwd: workingDir });
        execSync('git config user.email "renderbot@example.com"', { cwd: workingDir });
        execSync('git commit -m "Deploying metadata"', { cwd: workingDir });
        execSync('git remote remove origin', { cwd: workingDir });
        execSync(`git remote add origin ${repoUrl}`, { cwd: workingDir });
        execSync('git push -f origin main', { cwd: workingDir });

        console.log('✅ Metadata pushed to GitHub deploy repo');
    } catch (err) {
        console.error('❌ Git push failed:', err.message);
    }
}

async function deploy(objectDef) {
    cleanOldMetadata();
    // [... your existing deploy logic remains unchanged ...]

    return new Promise((resolve, reject) => {
        // [... after your existing deployment process completes successfully ...]
        pushToGitHubDeployRepo();
        resolve('Deployment completed and pushed to GitHub.');
    });
}

module.exports = {
    deploy,
    generateObjectXML: (objectName, fields) => {
        const objectDef = {
            object: objectName,
            fields: fields.map(field => ({
                name: field.name,
                label: field.label,
                type: field.type,
                ...field
            }))
        };
        return deploy(objectDef);
    },
    deployMetadata: () => Promise.resolve('Deployment handled by deploy()')
};
