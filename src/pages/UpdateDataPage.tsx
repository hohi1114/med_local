import { useState } from "react";
import FileUpload from "../components/data/FileUpload";
import { parseDaysFiles, parsePlaceFiles } from "../utils/ExcelParser";
import { processData } from "../components/data/DataProcessor";
import {
  saveToIndexedDB,
  getDataFromIndexedDB,
  clearIndexedDB,
} from "../components/data/IndexedDB";
import * as XLSX from "xlsx";
import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import { RangePickerProps } from "antd/es/date-picker";
import BaseButton from "../components/common/button/BaseButton";

const UpdateDataPage = () => {
  const [rangeDate, setRangeDate] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
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

    const { df_merged: storedMerged, df_summary: storedSummary } =
      await getDataFromIndexedDB();
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

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates, _) => {
    if (dates && dates[0] && dates[1]) {
      setRangeDate({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate(),
      });
    }
  };

  return (
    <UpdateDataContainer>
      <ContentHeader title={"데이터 업데이트"} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <div style={{ marginBottom: "4rem" }}>
          <ContentContainer>
            <TitleStyle>분석하실 데이터의 기간을 선택해주세요.</TitleStyle>
            <DurationDatePicker
              rangeDate={rangeDate}
              handleDateChange={handleDateChange}
            />
          </ContentContainer>
        </div>

        <ContentContainer>
          <FileUpload
            title="일일 수입 업로드"
            onFilesUploaded={(files) => setDaysFiles(files)}
          />
          <FileUpload
            title="연령대별 환자현황 업로드"
            onFilesUploaded={(files) => setPlaceFiles(files)}
          />
        </ContentContainer>
        <div style={{ marginTop: "2rem" }}>
          <BaseButton
            type="submit"
            onClick={handleProcessData}
            disabled={!daysFiles || !placeFiles}
          >
            데이터 처리하기
          </BaseButton>
        </div>
      </div>
      {/* 
      


      <button onClick={handleCheckIndexedDB}>Check IndexedDB (Top 100)</button>


      <button
        onClick={handleClearDB}
        style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}
      >
        Clear IndexedDB
      </button>


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
      <pre>{JSON.stringify(indexedSummary, null, 2)}</pre> */}
    </UpdateDataContainer>
  );
};

export default UpdateDataPage;

const UpdateDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
