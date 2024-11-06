import gcpMetaData from "gcp-metadata";

// undefined - uninitialized, null - not available, string - project ID
let gcpProjectId: string | undefined;

export function getGcpProjectId() {
  return process.env.GCP_PROJECT || gcpProjectId;
}

/**
 * Fetches the Google Cloud Platform (GCP) project ID from the GCP metadata server.
 *
 * You only need to call this function if you're not setting the `GCP_PROJECT` environment variable.
 */
export async function fetchGcpProjectId() {
  const isAvailable = await gcpMetaData.isAvailable();
  if (!isAvailable) return;

  gcpProjectId = await gcpMetaData.project("project-id");
}

/**
 * Resets the GCP project ID, for testing.
 */
export function reset() {
  gcpProjectId = undefined;
}
