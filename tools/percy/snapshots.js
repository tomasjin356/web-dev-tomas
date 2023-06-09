const percySnapshot = require('@percy/puppeteer');
const puppeteer = require('puppeteer');
const scrollToBottom = require('scroll-to-bottomjs');

const pagesToTest = [
  {
    url: '/',
    name: 'Home page',
  },
  {
    url: '/handbook/content-types/example-landing-page/',
    name: 'Landing page example',
  },
  {
    url: '/handbook/content-types/example-collection/',
    name: 'Collection page example',
  },
  {
    url: '/handbook/content-types/example-post/',
    name: 'Post example',
  },
  {
    url: '/handbook/content-types/example-item-page/',
    name: 'Item page example',
  },
  {
    url: '/handbook/content-types/example-explore-page/',
    name: 'Explore page example',
  },
  {
    url: '/handbook/content-types/example-course/',
    name: 'Course page example',
  },
  {
    url: '/handbook/content-types/example-codelab/',
    name: 'Codelab page example',
  },
  {
    url: '/handbook/content-types/example-pattern-set/',
    name: 'Pattern-set page example',
  },
  {
    url: '/handbook/content-types/example-pattern/',
    name: 'Pattern page example',
  },
];

// A script to navigate our app and take snapshots with Percy.
(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const pageToTest of pagesToTest) {
    const page = await browser.newPage();
    await page.setViewport({height: 1024, width: 1280});

    const url = new URL(pageToTest.url, 'http://localhost:8080').href;
    await page.goto(url, {waitUntil: 'networkidle0'});
    await page.evaluate(scrollToBottom);
    await percySnapshot(page, `${pageToTest.name}`);
    await page.close();
  }

  await browser.close();
})();
