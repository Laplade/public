import * as _puppeteer from "puppeteer";

export let page: _puppeteer.Page;
export let browser: _puppeteer.Browser;
export const init = async (isDebug: boolean) => {
  browser = await _puppeteer.launch({
    headless: !isDebug,
    devtools: isDebug,
    args: [
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-zygote", // 常駐プロセスなし
      "--single-process", // シングルプロセスにする
      "--disable-dev-shm-usage", // シェアドメモリファイルをディスクにする
      "--incognito", // シークレットモードで直接起動する
      "--no-referrers", // HTTP-Referer ヘッダーを送信しない
    ],
    defaultViewport: { width: 1600, height: 1200 },
  });
  page = (await browser.pages())[0];
};

export const goto = async (
  url: string,
  until: _puppeteer.PuppeteerLifeCycleEvent[] = ["load", "networkidle2"]
) => {
  await page.goto(url, { waitUntil: until });
};

export const click = async (
  selector: string,
  until: _puppeteer.PuppeteerLifeCycleEvent[] = ["load", "networkidle2"]
) => {
  await Promise.all([
    page.waitForNavigation({ waitUntil: until }),
    page.click(selector),
  ]);
};

export const autoScroll = async () => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 50;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve(0);
        }
      }, 100);
    });
  });
};
