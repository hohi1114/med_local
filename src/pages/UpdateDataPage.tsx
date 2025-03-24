import { useState } from "react";
import FileUpload from "../components/upload_data/FileUpload.tsx";
import { parseDailyIncomeEgis, parseDaysFilesEuiSarang, parsePatientIncomeEgis, parsePatientListEgis, parsePlaceFilesEuiSarang } from "../utils/ExcelParser.ts"
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
import {
  createDistrictDataFromNeighborhoods,
  populateDistrictsFromNeighborhoods,
  storePatientsByRegion,
  initRegionDB,
} from "../store/indexded_db/RegionDB.ts";
import Loading from "../components/common/Loading.tsx";
import { Button } from "antd"; // Import Button for styled buttons
import { uploadDataToBackendEgis, uploadDataToBackendEuisarang } from "../utils/api/apis";
import ContentHeader from "../components/common/layout/ContentHeader.tsx";

const UpdateDataPage = () => {
  const [dailyIncome, setDailyIncomeFiles] = useState<FileList | null>(null);
  const [placeFiles, setPlaceFiles] = useState<FileList | null>(null);
  const [patient, setPatientFiles] = useState<FileList | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [api, contextHolder] = notification.useNotification();
  const [localData, setLocalData] = useState<number>(0);

  const openNotification = (type: 'success' | 'error' | 'warning', message: string, description: string) => {
    api[type]({
      message,
      description,
      placement: "topRight",
      duration: type === 'error' ? 0 : 3,
    });
  };


  const { areas: areas_small } = useMediMapData("normalized_small_db.json");
  const { areas: areas_dong } = useMediMapData("fixed_polygon.json");
  const { areas: areas_gu } = useMediMapData("district_boundaries.json");

  // ✅ Load Naver Maps Script on Component Mount
  useEffect(() => {
    loadNaverMapsScript(import.meta.env.VITE_NAVER_MAPS_CLIENT_ID)
      .then(() => { })
      .catch((error) =>
        console.error("❌ Failed to load Naver Maps script:", error)
      );
  }, []);

  // ✅ Initialize RegionDBs on Component Mount
  useEffect(() => {
    const initializeDatabases = async () => {
      try {
        await initIndexedDB();
        // Initialize databases for each region type
        if (areas_small && areas_small.length > 0) {
          await initRegionDB(areas_small, "small");
        }
        if (areas_dong && areas_dong.length > 0) {
          await initRegionDB(areas_dong, "dong");
        }
        if (areas_gu && areas_gu.length > 0) {
          await initRegionDB(areas_gu, "gu");
        }
        console.log("✅ All RegionDBs initialized");
      } catch (error) {
        console.error("❌ Error initializing RegionDBs:", error);
        openNotification("error", "데이터베이스 오류", "데이터베이스 초기화에 실패했습니다.");
      }
    };

    initializeDatabases();
  }, [areas_small, areas_dong, areas_gu]); //

  useEffect(() => {
    if (progress === 100) {
      openNotification("success", "데이터 처리 완료", "데이터 처리가 완료되었습니다.");
    }
  }, [progress]);


  /*
    // Process and upload data
    const handleProcessDataEuisarang = async () => {
      if (!placeFiles || !daysFiles) {
        openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
        return;
      }
  
      setProgress(1); // Start progress
  
      try {
        // Parse files
        const visits = await parseDaysFilesEuiSarang(daysFiles);
        const patients = await parsePlaceFilesEuiSarang(placeFiles);
        setProgress(20);
  
        // Simulate progress for parsing
        setProgress(40);
  
        // Upload to backend (token is handled by authApi interceptor)
        const backendResponse = await uploadDataToBackendEuisarang(visits, patients);
        setProgress(100);
  
        // Update local data count
        setLocalData(visits.length); // Adjust as needed
  
        console.log(`✅ Backend response: ${backendResponse.message}, Processed: ${backendResponse.processedRecords}`);
      } catch (error) {
        console.error("❌ Error processing data:", error);
        openNotification("error", "데이터 처리 실패", error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        setProgress(0); // Reset progress on error
      }
    };
  
  */
  const handleProcessDataEgis = async () => {
    if (!placeFiles || !dailyIncome || !patient) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    try {
      // New parsing logic for Version 2 (assuming new parser functions exist)
      const dailyIncomeData = await parseDailyIncomeEgis(dailyIncome);
      const patientListData = await parsePatientListEgis(placeFiles);
      const patientIncomeData = await parsePatientIncomeEgis(patient);

      setProgress(20);

      // Simulate progress for parsing
      setProgress(40);

      // Upload to backend (V2 API with multiple datasets)
      await uploadDataToBackendEgis(dailyIncomeData, patientListData, patientIncomeData);
      setProgress(100);

      // Update local data count
      setLocalData(dailyIncomeData.length);

      console.log("✅ Backend V2 processing completed successfully.");
    } catch (error) {
      console.error("❌ Error processing V2 data:", error);
      openNotification("error", "데이터 처리 실패", error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      setProgress(0);
    }
  };




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
      <ContentHeader title={"데이터 업데이트"} />
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
            title="일자별 수입 현황"
            onFilesUploaded={(files) => setDailyIncomeFiles(files)}
          />

          <FileUpload
            title="환자 목록"
            onFilesUploaded={(files) => setPlaceFiles(files)}
          />
          <FileUpload
            title="환자별 수입현황"
            onFilesUploaded={(files) => setPatientFiles(files)}
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
                onClick={handleProcessDataEgis}
                disabled={!dailyIncome || !placeFiles || !patient || progress > 0}
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