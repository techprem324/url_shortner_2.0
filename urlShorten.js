// urlShorten.js
// Example: Shorten a URL using TinyURL API and axios

const axios = require('axios');

async function shortenUrl(longUrl) {
  try {
    const response = await axios.get('https://tinyurl.com/api-create.php', {
      params: { url: longUrl }
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to shorten URL: ' + error.message);
  }
}

// Example usage:
(async () => {
  const longUrl = 'https://www.example.com';
  const shortUrl = await shortenUrl(longUrl);
  console.log('Shortened URL:', shortUrl);
})();
