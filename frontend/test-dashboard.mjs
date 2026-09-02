import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('REACT ERROR:', msg.text());
        }
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    const content = await page.content();
    console.log('DASHBOARD HTML LENGTH:', content.length);

    await browser.close();
})();
