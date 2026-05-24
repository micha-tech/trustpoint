import * as functions from "firebase-functions/v1";
import next from "next";

const nextjsApp = next({
  dev: false,
  conf: {
    distDir: "../.next",
    outputFileTracingRoot: "..",
  },
});
const handle = nextjsApp.getRequestHandler();

export const nextjs = functions
  .runWith({ memory: "1GB", minInstances: 0 })
  .https.onRequest(async (req, res) => {
    await nextjsApp.prepare();
    return handle(req, res);
  });
