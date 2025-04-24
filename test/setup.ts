import * as chai from "chai";
import "@bonniernews/node-test-bdd/register-bdd";

// Make sure dates are displayed in the correct timezone
process.env.TZ = "Europe/Stockholm";

// Tests should always run in test environment to prevent accidental deletion of
// real elasticsearch indices etc.
process.env.NODE_ENV = "test";

chai.config.truncateThreshold = 0;
chai.config.includeStack = true;

// nock.enableNetConnect(/(localhost|127\.0\.0\.1):\d+/);

(global as any).expect = chai.expect;

declare global {
  const expect: Chai.ExpectStatic;
}
