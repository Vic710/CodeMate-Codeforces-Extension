const { spawn } = require('child_process');
const path = require('path');

async function scrapeProblem(url) {
    return new Promise((resolve, reject) => {
        console.log('Starting scraper with URL:', url);
        
        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../python/scraper.py'),
            url
        ], {
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            console.log('Python stdout:', data.toString());
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error('Python stderr:', data.toString());
            errorString += data.toString();
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            reject(new Error(`Failed to start Python process: ${error.message}`));
        });

        pythonProcess.on('close', (code) => {
            console.log('Python process exited with code:', code);
            if (code !== 0) {
                reject(new Error(`Scraper failed with code ${code}: ${errorString || 'No error message'}`));
                return;
            }
            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (error) {
                reject(new Error(`Failed to parse scraper output: ${error.message}`));
            }
        });
    });
}

module.exports = { scrapeProblem };