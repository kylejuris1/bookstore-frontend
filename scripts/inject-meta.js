const fs = require('fs');
const path = require('path');

// Path to the generated index.html file
const indexPath = path.join(__dirname, '../dist/index.html');

// Meta tag to inject
const metaTag = '<meta name="google-site-verification" content="f4hE6CjKLJ6awC43ORfLGx9m34-MYJy13FZ3qqSpNw8" />';

try {
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Check if meta tag already exists
    if (!html.includes('google-site-verification')) {
      // Find the <head> tag and insert the meta tag right after it
      const headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        const insertPosition = headMatch.index + headMatch[0].length;
        html = html.slice(0, insertPosition) + '\n    ' + metaTag + html.slice(insertPosition);
        fs.writeFileSync(indexPath, html, 'utf8');
        console.log('✓ Google site verification meta tag injected into index.html');
      } else {
        console.error('✗ Could not find <head> tag in index.html');
      }
    } else {
      console.log('✓ Google site verification meta tag already exists in index.html');
    }
  } else {
    console.error(`✗ index.html not found at ${indexPath}`);
  }
} catch (error) {
  console.error('✗ Error injecting meta tag:', error);
  process.exit(1);
}

