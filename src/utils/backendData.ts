
export async function fetchDataFromBackend() {
    try {
      const response = await fetch("/api/data/all?userId=abc-123");
      const result = await response.json();
      console.log("Fetched data:", result);
      // Handle or store the data
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }
  