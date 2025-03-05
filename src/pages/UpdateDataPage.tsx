import { useState } from "react";
import FileUpload from "../components/data/FileUpload";
import { parseDaysFiles, parsePlaceFiles } from "../utils/ExcelParser";
import {
  saveToIndexedDB,
  getDataFromIndexedDB,
} from "../components/data/IndexedDB";
import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import BaseButton from "../components/common/button/BaseButton";
import { MergedData, processData } from "../components/data/DataProcessor";
import { loadNaverMapsScript } from "../utils/NaverGeocode";
import { useEffect } from "react";
import { Progress } from "antd";
import UploadedCalendar from "../components/data/UploadedCalendar";

const UpdateDataPage = () => {
  const [daysFiles, setDaysFiles] = useState<FileList | null>(null);
  const [placeFiles, setPlaceFiles] = useState<FileList | null>(null);
  //   const [mergedData, setMergedData] = useState<any[]>([]);
  //   const [filteredData, setFilteredData] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(0);
  //   const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);

  // ✅ Load Naver Maps Script on Component Mount
  useEffect(() => {
    loadNaverMapsScript(import.meta.env.VITE_NAVER_MAPS_CLIENT_ID)
      .then(() => {})
      .catch((error) =>
        console.error("❌ Failed to load Naver Maps script:", error)
      );
  }, []);

  // 🔹 Process and Store Data in IndexedDB
  const handleProcessData = async () => {
    setProgress(0);
    if (!placeFiles || !daysFiles) return;
    const visits = await parseDaysFiles(daysFiles);

    const patients = await parsePlaceFiles(placeFiles);

    let existingMergedData: MergedData[] = [];

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
    const { df_merged, df_filtered } = await processData(
      visits,
      patients,
      existingMergedData.length > 0 ? existingMergedData : [],
      setProgress
    );

    setProgress(100);

    console.log(df_merged, df_filtered);

    await saveToIndexedDB(df_merged, df_filtered);

    // const { df_merged: storedMerged, df_filtered: storedFiltered } =
    //   await getDataFromIndexedDB();
    // setMergedData(storedMerged);
    // setFilteredData(storedFiltered);
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
            <TitleStyle>저장한 데이터 현황</TitleStyle>
            <UploadedCalendar />
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
          {progress > 0 ? (
            <Progress
              percent={Math.ceil(progress)}
              percentPosition={{ align: "center", type: "inner" }}
              size={["50vh", 20]}
              strokeColor="#92BFFF"
            />
          ) : (
            <BaseButton
              type="submit"
              onClick={handleProcessData}
              disabled={!daysFiles || !placeFiles}
            >
              데이터 처리하기
            </BaseButton>
          )}
        </div>
      </div>
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
