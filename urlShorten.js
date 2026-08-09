// urlShorten.js
// Utility script for programmatic URL shortening via local server or TinyURL API

/**
 * Shorten a URL using TinyURL API as a fallback utility
 * @param {string} longUrl 
 * @returns {Promise<string>}
 */
async function shortenUrlWithTinyURL(longUrl) {
  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const shortUrl = await response.text();
    return shortUrl;
  } catch (error) {
    throw new Error('Failed to shorten URL: ' + error.message);
  }
}

/**
 * Shorten a URL via local running instance
 * @param {string} longUrl 
 * @param {string} baseUrl 
 */
async function shortenUrlLocal(longUrl, baseUrl = 'http://localhost:3001') {
  try {
    const response = await fetch(`${baseUrl}/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url: longUrl }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Failed to shorten via local server: ' + error.message);
  }
}

// Example usage if executed directly
if (require.main === module) {
  (async () => {
    const sampleUrl = 'https://github.com/nodejs/node';
    console.log(`🔗 Shortening sample URL: ${sampleUrl}`);
    try {
      const result = await shortenUrlWithTinyURL(sampleUrl);
      console.log('✅ TinyURL Result:', result);
    } catch (err) {
      console.error('⚠️ Notice:', err.message);
    }
  })();
}

module.exports = {
  shortenUrlWithTinyURL,
  shortenUrlLocal,
};
