import * as firebase from "../src/firebase";
import * as firebaseAdmin from "../src/firebase-admin";
import * as puppeteer from "../src/puppeteer";
import * as utility from "../src/utility";

(async () => {
  utility.date.getNow(900000);
  //   firebaseAdmin.init("./service-account-key.json");
  await puppeteer.init(true);
  await puppeteer.browser.close();
})();
