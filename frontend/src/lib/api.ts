const BACKEND_URL = "http://127.0.0.1:8000";

export type ProgressCallback = (status: string) => void;
export type ResultCallback = (result: {
  response: string;
  intent: string;
  language: string;
}) => void;
export type ErrorCallback = (error: string) => void;

export interface UploadResponse {
  status: string;
  filename: string;
  language: string;
  char_count: number;
  preview: string;
}

/**
 * Uploads a markdown/text file to the FastAPI backend.
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = "File upload failed";
    try {
      const parsed = JSON.parse(errorText);
      detail = parsed.detail || detail;
    } catch {
      detail = errorText || detail;
    }
    throw new Error(detail);
  }

  return response.json();
}

/**
 * Streams real-time progress updates and the final query resolution via Server-Sent Events (SSE).
 */
export async function sendChatMessageStream(
  query: string,
  onProgress: ProgressCallback,
  onResult: ResultCallback,
  onError: ErrorCallback
): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let detail = "Chat request failed";
      try {
        const parsed = JSON.parse(errorText);
        detail = parsed.detail || detail;
      } catch {
        detail = errorText || detail;
      }
      throw new Error(detail);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last incomplete block in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.replace("event:", "").trim();
        } else if (trimmed.startsWith("data:")) {
          const dataVal = trimmed.replace("data:", "").trim();

          if (currentEvent === "progress") {
            onProgress(dataVal);
          } else if (currentEvent === "result") {
            try {
              const parsed = JSON.parse(dataVal);
              onResult(parsed);
            } catch (err) {
              onError("Failed to parse prediction results");
            }
          } else if (currentEvent === "error") {
            onError(dataVal);
          }
        }
      }
    }
  } catch (error: any) {
    onError(error.message || "An unexpected network error occurred");
  }
}

/**
 * Direct token classification metadata extractor stream for the legacy page.
 */
export async function extractMetadataStream(
  lang: "en" | "ml",
  text: string,
  onProgress: (status: string) => void,
  onResult: (result: any) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/extract/stream/${lang}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Server returned status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last incomplete block in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.replace("event:", "").trim();
        } else if (trimmed.startsWith("data:")) {
          const dataVal = trimmed.replace("data:", "").trim();

          if (currentEvent === "progress") {
            onProgress(dataVal);
          } else if (currentEvent === "result") {
            try {
              const parsed = JSON.parse(dataVal);
              onResult(parsed);
            } catch (err) {
              onError("Failed to parse prediction results");
            }
          } else if (currentEvent === "error") {
            onError(dataVal);
          }
        }
      }
    }
  } catch (error: any) {
    onError(error.message || "An unexpected network error occurred");
  }
}

