// geometry.ts
/**
 * Utility functions related to geometry and string processing.
 */

export function extractDistrictFromNeighborhood(neighborhoodName: string): string {
    const parts = neighborhoodName.split(' ');
    if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
    }
    return neighborhoodName;
}

/**
 * Determine if a point is inside a polygon using the ray-casting algorithm.
 *
 * @param lat - Latitude of the point to test
 * @param lng - Longitude of the point to test
 * @param polygonCoords - Array of [longitude, latitude] pairs defining the polygon
 * @returns true if the point is inside the polygon; otherwise, false
 */
export function isPointInPolygon(
    lat: number,
    lng: number,
    polygonCoords: [number, number][]
): boolean {
    let inside = false;

    // Loop through each edge of the polygon
    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
        const [lngI, latI] = polygonCoords[i];
        const [lngJ, latJ] = polygonCoords[j];

        // Check if the point's latitude is between latI and latJ (exclusive)
        const intersect =
            (latI > lat) !== (latJ > lat) &&
            // and the point's longitude is to the left of the line connecting (lngI, latI) -> (lngJ, latJ)
            lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Recursively flatten a deeply nested array of [lng, lat] pairs
 * into a single polygon (array of [lng, lat]).
 */
export function flattenToPairs(nested: any): [number, number][] {
    const pairs: [number, number][] = [];

    function recurse(arr: any) {
        if (!Array.isArray(arr)) return;

        // If the first element is itself a [lng, lat] pair (both numbers),
        // we assume the entire array is pairs
        if (
            Array.isArray(arr[0]) &&
            arr[0].length === 2 &&
            typeof arr[0][0] === 'number' &&
            typeof arr[0][1] === 'number'
        ) {
            for (const pair of arr) {
                pairs.push([pair[0], pair[1]]);
            }
        } else {
            // Otherwise, go deeper
            for (const item of arr) {
                recurse(item);
            }
        }
    }

    recurse(nested);
    return pairs;
}

