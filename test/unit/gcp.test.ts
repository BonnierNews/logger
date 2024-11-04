import gcpMetaData from "gcp-metadata";
import { createSandbox } from "sinon";
import { getGcpProjectId, init, reset } from "../../lib/gcp";

const sandbox = createSandbox();

describe("GCP log fields", () => {
  afterEach(() => {
    reset();
    sandbox.restore();
  });

  it("should fetch the GCP project ID if available from the metadata server", async () => {
    sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
    sandbox.stub(gcpMetaData, "project").resolves("test-project");

    await init();
    expect(getGcpProjectId()).to.equal("test-project");
  });

  it("should return `null` if the the GCP metadata server is not available", async () => {
    sandbox.stub(gcpMetaData, "isAvailable").resolves(false);

    await init();
    expect(getGcpProjectId()).to.equal(null);
  });

  it("should use the environment variable if provided", async () => {
    process.env.GCP_PROJECT = "test-project-env";

    await init();
    expect(getGcpProjectId()).to.equal("test-project-env");

    delete process.env.GCP_PROJECT;
  });

  it("should not fetch the GCP project ID if already initialized", async () => {
    const availableStub = sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
    const projectStub = sandbox.stub(gcpMetaData, "project").resolves("other-test-project");

    await init();
    await init();
    expect(getGcpProjectId()).to.equal("other-test-project");
    expect(availableStub.callCount).to.equal(1);
    expect(projectStub.callCount).to.equal(1);
  });
});
