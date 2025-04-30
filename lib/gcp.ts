export const GCP_METADATA_URL = "http://metadata.google.internal/computeMetadata/v1/project/project-id"; // Export for testing
/**
 * Fetches the Google Cloud Platform (GCP) project ID from the GCP metadata server.
 *
 * You can alternatively set the `GCP_PROJECT` environment variable, which takes precedence.
 */
export async function getGcpProjectId(): Promise<string | undefined> {
  if (process.env.GCP_PROJECT) {
    return process.env.GCP_PROJECT;
  }

  try {
    const projectId = await fetch(GCP_METADATA_URL, {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(50), // Metadata server should respond realy fast
    }).then((res) => res.text());
    return projectId;
  } catch {
    // Ignore errors, as they probably mean we're not running on GCP
    return;
  }
}
