import { useState } from "react";
import FileUpload from "../components/upload_data/FileUpload.tsx";
import { parseDaysFiles, parsePlaceFiles } from "../utils/ExcelParser";
import {
  saveToIndexedDB,
  getDataFromIndexedDB,
  initIndexedDB
} from "../store/indexded_db/IndexedDB.ts";
import styled from "styled-components";
import ContentHeaderRefresh from "../components/common/layout/ContentHeaderRefresh";
import BaseButton from "../components/common/button/BaseButton";
import { MergedData, BackendData } from "../types/medi-types";
import { processData } from "../components/upload_data/DataProcessor.ts";
import { loadNaverMapsScript } from "../utils/NaverGeocode";
import { useEffect } from "react";
import { Progress, notification } from "antd";
import UploadedCalendar from "../components/upload_data/UploadedCalendar.tsx";
import useMediMapData from "../hooks/useMediMapData.tsx";

import Loading from "../components/common/Loading.tsx";
import { uploadDataToBackend } from "../utils/api/apis";

const UpdateDataPage = () => {
  const [daysFiles, setDaysFiles] = useState<FileList | null>(null);
  const [placeFiles, setPlaceFiles] = useState<FileList | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [api, contextHolder] = notification.useNotification();
  const [localData, setLocalData] = useState<number>(0);

  const openNotification = (
    type: "success" | "error" | "warning",
    message: string,
    description: string
  ) => {
    api[type]({
      message,
      description,
      placement: "topRight",
      duration: type === "error" ? 0 : 3
    });
  };

  const { areas: areas_small } = useMediMapData("normalized_small_db.json");
  const { areas: areas_dong } = useMediMapData("fixed_polygon.json");
  const { areas: areas_gu } = useMediMapData("district_boundaries.json");

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
      // ✅ Try fetching existing data
      const dbData = await getDataFromIndexedDB(); //이거를 backend에서 불러와야 할 듯함. local에 있는거 면 이상하자나, 그럼 back이랑 local이랑 동기화 됐는지 알 수 있는 data?
      if (dbData && dbData.df_merged) {
        existingMergedData = dbData.df_merged;
      }
    } catch (error) {
      console.warn("⚠️ IndexedDB not found. Skipping duplicate check.", error);
    }
    // 🔹 Process Data inside DataProcessor
    const { df_merged, df_filtered, df_date } = await processData(
      visits,
      patients,
      existingMergedData.length > 0 ? existingMergedData : [],
      setProgress
    );

    console.log(df_merged, df_filtered, df_date);

    await saveToIndexedDB(df_merged, df_filtered, df_date);

    uploadDataToBackend({
      merged_data: df_merged,
      filtered_data: df_filtered,
      df_date
    });

    await storePatientsByRegion(df_filtered, areas_small, "small");

    // 2. Process neighborhoods
    await storePatientsByRegion(df_filtered, areas_dong, "dong");

    // 3. Create district structure
    await storePatientsByRegion(df_filtered, areas_gu, "gu");

    setProgress(100);
  };

  // Handle backend data when fetched from ContentHeaderRefresh
  const handleDataFetched = async (backendData: BackendData | undefined) => {
    if (!backendData || !backendData.merged_data) return; // Exit if no valid backend data

    let existingMergedData: MergedData[] = [];
    let existingFilteredData: BackendData["filtered_data"] = [];
    let existingDates: BackendData["df_date"] = [];

    try {
      const dbData = await getDataFromIndexedDB();
      if (dbData) {
        existingMergedData = dbData.df_merged || [];
        existingFilteredData = dbData.df_filtered || [];
        existingDates = dbData.df_date || [];
      }
    } catch (error) {
      console.warn("⚠️ IndexedDB not found. Using backend data as is.", error);
    }
    // If local data is empty, simply save the backend data
    if (!existingMergedData.length) {
      await saveToIndexedDB(
        backendData.merged_data,
        backendData.filtered_data,
        backendData.df_date
      );
      setLocalData(backendData.merged_data.length);
      openNotification(
        "success",
        "데이터 동기화",
        "서버 데이터가 로컬에 저장되었습니다."
      );
      return;
    }

    // Check if the local merged data is identical to the backend merged data
    if (existingMergedData.length == backendData.merged_data.length) {
      setLocalData(existingMergedData.length);
      openNotification(
        "success",
        "데이터 동일",
        "로컬 데이터와 서버 데이터가 동일합니다."
      );
    } else {
      // Remove duplicates from merged_data (keep only new records)
      const newMergedData = backendData.merged_data.filter(
        (record) =>
          !existingMergedData.some(
            (existing) =>
              existing.chartNumber === record.chartNumber &&
              existing.visitDate === record.visitDate &&
              existing.totalCost === record.totalCost
          )
      );
      console.log(backendData.merged_data);
      console.log(existingMergedData);
      console.log(newMergedData);

      const newFilteredData = backendData.filtered_data.filter(
        (record) =>
          !existingFilteredData.some(
            (existing) =>
              existing.chartNumber === record.chartNumber &&
              existing.visitDate === record.visitDate &&
              existing.totalCost === record.totalCost
          )
      );

      const newDates = backendData.df_date.filter(
        (record) =>
          !existingDates.some((existing) => existing.date === record.date)
      );

      // Only save if there are new items
      if (
        newMergedData.length > 0 ||
        newFilteredData.length > 0 ||
        newDates.length > 0
      ) {
        await saveToIndexedDB(newMergedData, newFilteredData, newDates);

        await storePatientsByRegion(newFilteredData, areas_small, "small");
        await storePatientsByRegion(newFilteredData, areas_dong, "dong");
        await storePatientsByRegion(newFilteredData, areas_dong, "gu");

        setLocalData(newMergedData.length + existingMergedData.length);
        console.log(
          `Added ${newMergedData.length} new merged items, ${newFilteredData.length} new filtered items, ${newDates.length} new dates`
        );
        openNotification(
          "success",
          "데이터 동기화",
          "서버 데이터와 로컬 데이터에 추가되었습니다다."
        );
      } else {
        openNotification(
          "success",
          "데이터 동기화",
          "서버 데이터가 로컬 데이터보다 적습니다"
        );
        setLocalData(existingMergedData.length);
      }
    }
  };

  useEffect(() => {
    if (progress === 100) {
      openNotification(
        "success",
        "데이터 처리 완료",
        "데이터 처리가 완료되었습니다."
      );
    }
  }, [progress]);

  return (
    <>
      {progress > 0 && progress < 100 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.1)"
          }}
        >
          <Loading content="데이터를 안전하게 처리중입니다." />
        </div>
      )}
      {contextHolder}
      <ContentHeaderRefresh
        title={"데이터 업데이트"}
        onDataFetched={handleDataFetched}
      />
      <UpdateDataContainer>
        <div style={{ marginBottom: "4rem" }}>
          <ContentContainer>
            <TitleStyle>저장한 데이터 현황</TitleStyle>
            <UploadedCalendar updated={progress === 100} />
            <DataInfo>현재 로컬 데이터 개수: {localData}개</DataInfo>
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
        {/**버튼 및 프로그래스바 */}
        <div style={{ marginTop: "2rem" }}>
          {progress > 0 ? (
            <Progress
              percent={Math.ceil(progress)}
              percentPosition={{ align: "center", type: "inner" }}
              size={["50vw", 20]}
              strokeColor="#92BFFF"
            />
          ) : (
            <div style={{ width: "50vh" }}>
              <BaseButton
                type="button"
                onClick={handleProcessData}
                disabled={!daysFiles || !placeFiles || progress > 0}
              >
                데이터 처리하기
              </BaseButton>
            </div>
          )}
        </div>
      </UpdateDataContainer>
    </>
  );
};

export default UpdateDataPage;

const UpdateDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0px;
  height: 100%;
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
const DataInfo = styled.span`
  font-size: 1rem;
  color: #666;
  margin-top: 1rem;
`;
