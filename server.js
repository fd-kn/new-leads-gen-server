const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
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

        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();
        console.log(`Chrome executable path: ${executablePath}`);

        if (fs.existsSync(executablePath)) {
            console.log('Chrome executable found.');
            // Check and set permissions
            fs.chmodSync(executablePath, '755');
            console.log('Permissions set to 755 for Chrome executable.');
        } else {
            console.error('Chrome executable not found.');

            const dirPath = '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/';
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    return;
                }
                console.log('Directory contents:', files);
            });
            res.status(500).json({ error: `Chrome executable not found at ${executablePath}` });
            return;
        
        }

 
        const browser = await puppeteer.launch({ 
            headless: true,
            executablePath: executablePath
        });

        console.log('Puppeteer launched successfully');
        console.log(`Chrome is saved at: ${executablePath}`);

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
