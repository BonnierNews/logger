let gcpProjectId: string | undefined = undefined;

export function getGcpProjectId() {
  return process.env.GCP_PROJECT || gcpProjectId;
}

/**
 * Fetches the Google Cloud Platform (GCP) project ID from the GCP metadata server.
 *
 * You only need to call this function if you're not setting the `GCP_PROJECT` environment variable.
 */
export async function fetchGcpProjectId() {
  let gcpMetaData;
  /* c8 ignore start */
  try {
    gcpMetaData = await import("gcp-metadata");
  } catch {
    console.error("Failed to import gcp-metadata module");
    return;
  }
  /* c8 ignore stop */

  const isAvailable = await gcpMetaData.isAvailable();
  if (!isAvailable) return;

  gcpProjectId = await gcpMetaData.project("project-id");
}

/**
 * Resets the GCP project ID, for testing.
 */
export async function reset() {
  gcpProjectId = undefined;
}
