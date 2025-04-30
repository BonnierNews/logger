import nock from "nock";
import { describe, it } from "node:test";

import { GCP_METADATA_URL, getGcpProjectId } from "../../lib/gcp";

describe("GCP log fields", () => {
  it("should fetch the GCP project ID if available from the metadata server", async () => {
    nock(GCP_METADATA_URL).get("").reply(200, "test-project");

    expect(await getGcpProjectId()).to.equal("test-project");
  });

  it("should return `undefined` if the the GCP metadata server is not available", async () => {
    nock(GCP_METADATA_URL).get("").delay(100);

    expect(await getGcpProjectId()).to.equal(undefined);
  });

  it("should use the environment variable if provided", async () => {
    process.env.GCP_PROJECT = "test-project-env";

    expect(await getGcpProjectId()).to.equal("test-project-env");

    delete process.env.GCP_PROJECT;
  });
});
