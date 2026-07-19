import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/compiler",
  headers: { "Content-Type": "application/json" },
});

export async function fetchLanguages() {
  const { data } = await client.get("/languages/");
  return data;
}

export async function runCode({ language, sourceCode, stdin }) {
  const { data } = await client.post("/run/", {
    language,
    source_code: sourceCode,
    stdin,
  });
  return data;
}

export async function fetchHistory() {
  const { data } = await client.get("/history/");
  return data;
}

export default client;
