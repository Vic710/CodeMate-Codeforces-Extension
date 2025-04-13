const { spawn } = require('child_process');
const path = require('path');

async function generateHint(problem) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../python/hint.py'),
            JSON.stringify(problem)
        ]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`ML process failed: ${errorString}`));
                return;
            }
            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (error) {
                reject(new Error('Failed to parse ML output'));
            }
        });
    });
}

module.exports = { generateHint };