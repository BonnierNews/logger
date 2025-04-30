import "@bonniernews/node-test-bdd/register-bdd";
import * as chai from "chai";
import nock from "nock";

// Make sure dates are displayed in the correct timezone
process.env.TZ = "Europe/Stockholm";

// Tests should always run in test environment to prevent accidental deletion of
// real elasticsearch indices etc.
process.env.NODE_ENV = "test";

chai.config.truncateThreshold = 0;
chai.config.includeStack = true;

beforeEachScenario(nock.disableNetConnect);
afterEachScenario(() => {
  if (nock.pendingMocks().length > 0) {
    const error = `There are pending mocks after test is done: ${JSON.stringify(nock.pendingMocks(), null, 2)}`;
    chai.assert.fail(error);
  }
  nock.cleanAll();
  nock.enableNetConnect();
});

(global as any).expect = chai.expect;

declare global {
  const expect: Chai.ExpectStatic;
}
