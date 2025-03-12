const BACKEND_URL=import.meta.env.VITE_LOCAL_URL;

console.log(BACKEND_URL);

export async function fetchDataFromBackend() {
  try {
    if (!BACKEND_URL) {
      throw new Error("Backend URL is not defined");
    }

    const response = await fetch(`${BACKEND_URL}/api/data/get`); // Corrected fetch URL
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Fetched data:", result);

    return result; // Return the fetched data if needed
  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
}
