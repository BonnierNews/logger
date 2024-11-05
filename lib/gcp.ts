import gcpMetaData from "gcp-metadata";

/**
 * Fetches the Google Cloud Platform (GCP) project ID from the GCP metadata server.
 *
 * You can alternatively set the `GCP_PROJECT` environment variable, which takes precedence.
 */
export async function getGcpProjectId(): Promise<string | undefined> {
  if (process.env.GCP_PROJECT) {
    return process.env.GCP_PROJECT;
  }

  const isAvailable = await gcpMetaData.isAvailable();
  if (!isAvailable) return;

  return await gcpMetaData.project("project-id");
}
