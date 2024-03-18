const puppeteer = require('puppeteer');
const express = require('express');

const app = express();

app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || 'naruto';

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1024 });

    await page.goto(`https://www.pinterest.com/search/pins/?q=${query}&rs=typed`, { timeout: 60000 });

    await page.waitForSelector('.en');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const uniqueImages = new Set();

    const scrollCount = 100;
    for (let i = 0; i < scrollCount; i++) {
      const imgSrcs = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const srcs = images.map(img => img.getAttribute('srcset') || img.getAttribute('src'));
        return srcs.filter(src => src); // Filter out null or empty strings
      });

      imgSrcs.forEach(src => {
        uniqueImages.add(src);
      });

      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const allImages = Array.from(uniqueImages);

    await browser.close();
    console.log(allImages.length);
    res.json(allImages);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: 'An error occurred while fetching the unique image URLs.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
