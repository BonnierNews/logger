import gcpMetaData from "gcp-metadata";

// undefined - uninitialized, null - not available, string - project ID
let gcpProjectId: string | null | undefined = undefined;

export function getGcpProjectId() {
  return gcpProjectId;
}

export async function init() {
  if (gcpProjectId === undefined) {
    gcpProjectId = process.env.GCP_PROJECT ?? (await fetchGcpProjectIdFromMetadataServer());
  }
}

async function fetchGcpProjectIdFromMetadataServer() {
  const isAvailable = await gcpMetaData.isAvailable();
  if (!isAvailable) return null;
  return (await gcpMetaData.project("project-id")) as string;
}

/**
 * Resets the GCP project ID, for testing.
 */
export function reset() {
  gcpProjectId = undefined;
}
