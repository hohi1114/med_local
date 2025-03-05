import { useState } from "react";
import FileUpload from "../components/data/FileUpload";
import { parseDaysFiles, parsePlaceFiles } from "../utils/ExcelParser";
import {MergedData, processData} from "../components/data/DataProcessor";
import { saveToIndexedDB, getDataFromIndexedDB, clearIndexedDB } from "../components/data/IndexedDB";
import { loadNaverMapsScript } from "../utils/NaverGeocode";
import { useEffect } from "react";
import * as XLSX from "xlsx"; // ✅ Use xlsx for export

const UpdateDataPage = () => {
    const [daysFiles, setDaysFiles] = useState<FileList | null>(null);
    const [placeFiles, setPlaceFiles] = useState<FileList | null>(null);
    const [mergedData, setMergedData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [indexedMerged, setIndexedMerged] = useState<any[]>([]);
    const [indexedFiltered, setIndexedFiltered] = useState<any[]>([]);
    const [progress, setProgress] = useState<number>(0);
    const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);



    // ✅ Load Naver Maps Script on Component Mount
    useEffect(() => {
        loadNaverMapsScript(import.meta.env.VITE_NAVER_MAPS_CLIENT_ID)
            .then(() => setIsScriptLoaded(true))
            .catch((error) => console.error("❌ Failed to load Naver Maps script:", error));
    }, []);


    // 🔹 Process and Store Data in IndexedDB
    const handleProcessData = async () => {
        if (!daysFiles || !placeFiles) {
            alert("Please upload both Days and Place files before processing.");
            return;
        }

        if (!isScriptLoaded) {
            alert("Naver Maps script is still loading. Please wait...");
            return;
        }


        setProgress(0);

        const visits = await parseDaysFiles(daysFiles);
        let patients = await parsePlaceFiles(placeFiles);


        let existingMergedData: MergedData[] = [];  // ✅ Default to empty arra

        try {
            // ✅ Try fetching existing data (If database doesn't exist yet, handle gracefully)
            const dbData = await getDataFromIndexedDB();
            if (dbData && dbData.df_merged) {
                existingMergedData = dbData.df_merged;
            }
        } catch (error) {
            console.warn("⚠️ IndexedDB not found. Skipping duplicate check.", error);
        }
        // 🔹 Process Data inside DataProcessor (handles filtering and geocoding)
        const { df_merged, df_filtered } = await processData(visits, patients, existingMergedData.length > 0 ? existingMergedData : [], setProgress);

        setProgress(100);

        console.log(df_merged, df_filtered);

        await saveToIndexedDB(df_merged, df_filtered);

        const { df_merged: storedMerged, df_filtered: storedFiltered } = await getDataFromIndexedDB();
        setMergedData(storedMerged);
        setFilteredData(storedFiltered);
    };

    // 🔴 Clear IndexedDB & Reset UI
    const handleClearDB = async () => {
        console.log("🗑️ Clearing IndexedDB...");
        await clearIndexedDB();
        setMergedData([]);
        setFilteredData([]);
        alert("IndexedDB cleared!");
    };

    // 🔹 Fetch & Show Top 100 IndexedDB Data
    const handleCheckIndexedDB = async () => {
        const { df_merged, df_filtered } = await getDataFromIndexedDB();
        setIndexedMerged(df_merged.slice(0, 100)); // Show only top 100
        setIndexedFiltered(df_filtered.slice(0, 100));
    };

    // 🔹 Convert JSON to Excel and Trigger Download
    const downloadExcel = async (data: any[], filename: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(dataBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2>Upload & Process Data</h2>

            <FileUpload title="Upload Days Data" onFilesUploaded={(files) => setDaysFiles(files)} />
            <FileUpload title="Upload Place Data" onFilesUploaded={(files) => setPlaceFiles(files)} />

            {/* Progress Bar */}
            <div style={{ width: "100%", backgroundColor: "#ccc", marginTop: "10px" }}>
                <div style={{ width: `${progress}%`, height: "20px", backgroundColor: "green" }}></div>
            </div>

            {/* 🔘 Process Data Button */}
            <button onClick={handleProcessData} disabled={!daysFiles || !placeFiles}>
                Process Data
            </button>

            {/* 🛠 Check IndexedDB */}
            <button onClick={handleCheckIndexedDB}>Check IndexedDB (Top 100)</button>

            {/* 🔴 Clear IndexedDB Button */}
            <button onClick={handleClearDB} style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}>
                Clear IndexedDB
            </button>

            {/* 🔽 Download Button */}
            {mergedData.length > 0 && (
                <button onClick={() => downloadExcel(mergedData, "df_merged.xlsx")}>
                    Download df_merged.xlsx
                </button>
            )}
            {filteredData.length > 0 && (
                <button onClick={() => downloadExcel(filteredData, "df_filtered.xlsx")}>
                    Download df_filtered.xlsx
                </button>
            )}

            <h3>🔝 Top 100 IndexedDB - df_merged</h3>
            <pre>{JSON.stringify(indexedMerged, null, 2)}</pre>

            <h3>🔝 Top 100 IndexedDB - df_filtered</h3>
            <pre>{JSON.stringify(indexedFiltered, null, 2)}</pre>
        </div>
    );
};

export default UpdateDataPage;
