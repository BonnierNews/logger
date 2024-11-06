import gcpMetaData from "gcp-metadata";
import { createSandbox } from "sinon";

import { getGcpProjectId } from "../../lib/gcp";

const sandbox = createSandbox();

describe("GCP log fields", () => {
  afterEach(() => {
    sandbox.restore();
  });

  it("should fetch the GCP project ID if available from the metadata server", async () => {
    sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
    sandbox.stub(gcpMetaData, "project").resolves("test-project");

    expect(await getGcpProjectId()).to.equal("test-project");
  });

  it("should return `undefined` if the the GCP metadata server is not available", async () => {
    sandbox.stub(gcpMetaData, "isAvailable").resolves(false);

    expect(await getGcpProjectId()).to.equal(undefined);
  });

  it("should use the environment variable if provided", async () => {
    process.env.GCP_PROJECT = "test-project-env";

    expect(await getGcpProjectId()).to.equal("test-project-env");

    delete process.env.GCP_PROJECT;
  });
});
