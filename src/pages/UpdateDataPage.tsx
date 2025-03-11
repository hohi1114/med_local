import { useState } from "react";
import FileUpload from "../components/upload_data/FileUpload.tsx";
import { parseDaysFiles, parsePlaceFiles } from "../utils/ExcelParser";
import {
  saveToIndexedDB,
  getDataFromIndexedDB
} from "../store/indexded_db/IndexedDB.ts";
import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import BaseButton from "../components/common/button/BaseButton";
import { MergedData } from "../types/medi-types";
import { processData } from "../components/upload_data/DataProcessor.ts";
import { loadNaverMapsScript } from "../utils/NaverGeocode";
import { useEffect } from "react";
import { Progress, notification } from "antd";
import UploadedCalendar from "../components/upload_data/UploadedCalendar.tsx";
import useMediMapData from "../hooks/useMediMapData.tsx";
import {
  createDistrictDataFromNeighborhoods,
  populateDistrictsFromNeighborhoods,
  storePatientsByRegion
} from "../store/indexded_db/RegionDB.ts";
import Loading from "../components/common/Loading.tsx";

const UpdateDataPage = () => {
  const [daysFiles, setDaysFiles] = useState<FileList | null>(null);
  const [placeFiles, setPlaceFiles] = useState<FileList | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [api, contextHolder] = notification.useNotification();

  const openNotification = () => {
    api.info({
      message: `데이터 업로드`,
      description: <div>데이터가 성공적으로 업로드 되었습니다!</div>,
      placement: "topRight",
      duration: 0,
      icon: null
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
      const dbData = await getDataFromIndexedDB();
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

    await saveToIndexedDB(
      df_merged,
      df_filtered,
      df_date,
      areas_small,
      areas_dong,
      areas_gu
    );

    await storePatientsByRegion(df_filtered, areas_small, "small");

    // 2. Process neighborhoods
    await storePatientsByRegion(df_filtered, areas_dong, "dong");

    // 3. Create district structure
    await createDistrictDataFromNeighborhoods(areas_dong);

    // 4. Populate districts with neighborhood data
    await populateDistrictsFromNeighborhoods();

    setProgress(100);
  };

  useEffect(() => {
    if (progress === 100) {
      openNotification();
    }
  }, [progress]);

  return (
    <>
      {progress === 0 && (
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
      <ContentHeader title={"데이터 업데이트"} />
      <UpdateDataContainer>
        <div style={{ marginBottom: "4rem" }}>
          <ContentContainer>
            <TitleStyle>저장한 데이터 현황</TitleStyle>
            <UploadedCalendar updated={progress === 100} />
          </ContentContainer>
        </div>
        {/**파일 업로드 */}
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
