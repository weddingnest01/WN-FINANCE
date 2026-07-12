const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://pnqswycgzldfhjnrqqyz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucXN3eWNnemxkZmhqbnJxcXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjA4MjYsImV4cCI6MjA5OTQzNjgyNn0.CGavptlK_g3CRSCMGCm825mrwRqE0E2j1_HII-2Z7gQ';
const BUCKET_NAME = 'assets';

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.ttf': return 'font/ttf';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}

async function uploadFile(filePath, destPath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    // We must encode the destination path properly
    const encodedDest = encodeURIComponent(destPath);
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${encodedDest}`);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': mimeType,
        'Content-Length': fileData.length
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[SUCCESS] Uploaded ${destPath}`);
          resolve(data);
        } else {
          console.error(`[ERROR] Failed to upload ${destPath}: ${res.statusCode} ${data}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`[ERROR] Exception uploading ${destPath}:`, e);
      resolve(null);
    });
    
    req.write(fileData);
    req.end();
  });
}

async function run() {
  const files = fs.readdirSync(__dirname);
  
  for (const file of files) {
    if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
      console.log(`Uploading root file: ${file}`);
      await uploadFile(path.join(__dirname, file), file);
    }
  }
  
  const fontDir = path.join(__dirname, 'font');
  if (fs.existsSync(fontDir)) {
    const fontFiles = fs.readdirSync(fontDir);
    for (const font of fontFiles) {
      if (font.endsWith('.ttf') || font.endsWith('.woff') || font.endsWith('.woff2')) {
        console.log(`Uploading font: ${font}`);
        await uploadFile(path.join(fontDir, font), `font/${font}`);
      }
    }
  }
}

run();
