import { useState } from "react";
import FileUpload from "../components/data/FileUpload";
import { parseDaysFiles, parsePlaceFiles } from "../utils/ExcelParser";
import { processData } from "../components/data/DataProcessor";
import { saveToIndexedDB, getDataFromIndexedDB, clearIndexedDB} from "../components/data/IndexedDB";
import * as XLSX from "xlsx";

const UpdateDataPage = () => {
    const [daysFiles, setDaysFiles] = useState<FileList | null>(null);
    const [placeFiles, setPlaceFiles] = useState<FileList | null>(null);
    const [mergedData, setMergedData] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [indexedMerged, setIndexedMerged] = useState<any[]>([]);
    const [indexedSummary, setIndexedSummary] = useState<any[]>([]);

    // 🔹 Process and Store Data in IndexedDB
    const handleProcessData = async () => {
        if (!daysFiles || !placeFiles) {
            alert("Please upload both Days and Place files before processing.");
            return;
        }

        const visits = await parseDaysFiles(daysFiles);
        const patients = await parsePlaceFiles(placeFiles);
        const { df_merged, df_summary } = processData(visits, patients);
        console.log(df_merged, df_summary);

        await saveToIndexedDB(df_merged, df_summary);

        const { df_merged: storedMerged, df_summary: storedSummary } = await getDataFromIndexedDB();
        setMergedData(storedMerged);
        setSummaryData(storedSummary);
    };

    // 🔴 Clear IndexedDB & Reset UI
    const handleClearDB = async () => {
        console.log("🗑️ Clearing IndexedDB...");
        await clearIndexedDB();
        setMergedData([]);
        setSummaryData([]);
        alert("IndexedDB cleared!");
    };


    // 🔹 Fetch & Show Top 100 IndexedDB Data
    const handleCheckIndexedDB = async () => {
        const { df_merged, df_summary } = await getDataFromIndexedDB();
        setIndexedMerged(df_merged.slice(0, 100)); // Show only top 100
        setIndexedSummary(df_summary.slice(0, 100));
    };

    // 🔹 Convert JSON to Excel and Trigger Download
    const downloadExcel = (data: any[], filename: string) => {
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



            {/* 🔽 Download Buttons */}
            {mergedData.length > 0 && (
                <button onClick={() => downloadExcel(mergedData, "df_merged.xlsx")}>
                    Download df_merged.xlsx
                </button>
            )}

            {summaryData.length > 0 && (
                <button onClick={() => downloadExcel(summaryData, "df_summary.xlsx")}>
                    Download df_summary.xlsx
                </button>
            )}


            <h3>🔝 Top 100 IndexedDB - df_merged</h3>
            <pre>{JSON.stringify(indexedMerged, null, 2)}</pre>

            <h3>🔝 Top 100 IndexedDB - df_summary</h3>
            <pre>{JSON.stringify(indexedSummary, null, 2)}</pre>
        </div>
    );
};

export default UpdateDataPage;
