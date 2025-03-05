declare const naver: any; // Declare global `naver` object for TypeScript

// ✅ Function to load the Naver Maps script dynamically
export const loadNaverMapsScript = (clientId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (window.naver && window.naver.maps) {
            console.log("✅ Naver Maps already loaded.");
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
        script.async = true;
        script.onload = () => {
            console.log("✅ Naver Maps script loaded successfully.");
            resolve();
        };
        script.onerror = () => {
            console.error("❌ Failed to load Naver Maps script.");
            reject(new Error("Naver Maps script failed to load."));
        };

        document.head.appendChild(script);
    });
};

// ✅ Function to wait for Naver Maps to be available
const waitForNaverMaps = (): Promise<void> => {
    return new Promise((resolve) => {
        if (window.naver && window.naver.maps && naver.maps.Service) {
            resolve();
        } else {
            const interval = setInterval(() => {
                if (window.naver && window.naver.maps && naver.maps.Service) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        }
    });
};

// ✅ Function to get latitude and longitude using Naver Geocode API
export const getLatLonNaver = async (
    address: string,
    updateProgress: (progress: number) => void,
    index: number,
    total: number
): Promise<{ latitude: number | null; longitude: number | null }> => {
    await waitForNaverMaps(); // ✅ Ensure Naver Maps is ready before calling `geocode`

    return new Promise((resolve) => {
        naver.maps.Service.geocode({ query: address }, (status: string, response: any) => {
            if (status === naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                updateProgress(((index + 1) / total) * 100);
                return resolve({
                    latitude: parseFloat(response.v2.addresses[0].y),
                    longitude: parseFloat(response.v2.addresses[0].x),
                });
            } else {
                console.error("❌ Error fetching geolocation:", status);
                updateProgress(((index + 1) / total) * 100);
                return resolve({ latitude: null, longitude: null });
            }
        });
    });
};
