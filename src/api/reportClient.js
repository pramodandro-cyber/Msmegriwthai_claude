const REPORT_ENDPOINT = import.meta.env.VITE_REPORT_API_URL;

export async function generateFundingReport({ form, docs, fallbackReport }) {
  if (!REPORT_ENDPOINT) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return fallbackReport;
  }

  const response = await fetch(REPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form, docs }),
  });

  if (!response.ok) throw new Error("AI report generation failed.");

  const data = await response.json();
  return data?.report || fallbackReport;
}
