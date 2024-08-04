const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Leads Gen Social Media Scrapper');
});

app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
 
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']

        });

        console.log('Puppeteer launched successfully');

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const socialLinks = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            const links = anchors.map(anchor => anchor.href);
            const facebookLinks = links.filter(href => href.includes('facebook.com'));
            const instagramLinks = links.filter(href => href.includes('instagram.com'));
            return { facebookLinks, instagramLinks };
        });

        await browser.close();

        // Remove duplicates
        const removeDuplicates = (array) => [...new Set(array)];
        const uniqueFacebookLinks = removeDuplicates(socialLinks.facebookLinks);
        const uniqueInstagramLinks = removeDuplicates(socialLinks.instagramLinks);

        res.json({
            facebookLinks: uniqueFacebookLinks,
            instagramLinks: uniqueInstagramLinks
        });

    } catch (error) {
        console.error('Error during Puppeteer operation:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
