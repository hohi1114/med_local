import { useState } from "react";
import FileUpload from "../components/upload_data/FileUpload.tsx";
import { parseDaysFilesEuisarang, parsePlaceFilesEuisarang, parseDailyIncomeEgis, parsePatientIncomeEgis, parsePatientListEgis } from "../utils/ExcelParser.ts";
import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import { loadNaverMapsScript } from "../utils/NaverGeocode";
import { useEffect } from "react";
import { Progress, notification, Select } from "antd";
import UploadedCalendar from "../components/upload_data/UploadedCalendar.tsx";
import Loading from "../components/common/Loading.tsx";
import { uploadDataToBackendEgis, uploadDataToBackendEuisarang, getUserEMR } from "../utils/api/apis";
import ContentHeader from "../components/common/layout/ContentHeader.tsx";

const UpdateDataPage = () => {
  const [dataType, setDataType] = useState<"euisarang" | "egis">("euisarang"); // Track data type
  const [daysFiles, setDaysFiles] = useState<FileList | null>(null); // Euisarang
  const [placeFiles, setPlaceFiles] = useState<FileList | null>(null); // Euisarang & Egis
  const [dailyIncome, setDailyIncome] = useState<FileList | null>(null); // Egis
  const [patient, setPatient] = useState<FileList | null>(null); // Egis
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

  // ✅ Load Naver Maps Script on Component Mount
  useEffect(() => {
    loadNaverMapsScript(import.meta.env.VITE_NAVER_MAPS_CLIENT_ID)
      .then(() => { })
      .catch((error) =>
        console.error("❌ Failed to load Naver Maps script:", error)
      );
  }, []);

  useEffect(() => {
    const fetchEMRType = async () => {
      try {
        const emrType = await getUserEMR();
        if (emrType === "euisarang" || emrType === "egis") {
          setDataType(emrType);
        }
      } catch (error) {
        console.error("❌ Error fetching EMR type:", error);
      }
    };

    fetchEMRType();
  }, []);



  useEffect(() => {
    if (progress === 100) {
      openNotification(
        "success",
        "데이터 처리 완료",
        "데이터 처리가 완료되었습니다."
      );
    }
  }, [progress]);

  // Process and upload data
  const handleProcessDataEuisarang = async () => {
    if (!placeFiles || !daysFiles) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    try {
      // Parse files
      const visits = await parseDaysFilesEuisarang(daysFiles);
      const patients = await parsePlaceFilesEuisarang(placeFiles);
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

  const handleProcessData = () => {
    if (dataType === "euisarang") {
      handleProcessDataEuisarang();
    } else {
      handleProcessDataEgis();
    }
  };

  const isButtonDisabled = () => {
    if (dataType === "euisarang") {
      return !daysFiles || !placeFiles || progress > 0;
    }
    return !dailyIncome || !placeFiles || !patient || progress > 0;
  };

  return (
    <>
      {progress > 0 && progress < 100 && (
        <Loading content="데이터를 안전하게 처리중입니다." />
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


        {/* Conditional File Uploads */}
        <ContentContainer>
          {dataType === "euisarang" ? (
            <>
              <FileUpload
                title="일일 수입 데이터 업로드"
                onFilesUploaded={(files) => setDaysFiles(files)}
              />
              <FileUpload
                title="장소별 환자 데이터 업로드"
                onFilesUploaded={(files) => setPlaceFiles(files)}
              />
            </>
          ) : (
            <>
              <FileUpload
                title="일자별 수입 현황 업로드"
                onFilesUploaded={(files) => setDailyIncome(files)}
              />
              <FileUpload
                title="환자 목록 업로드"
                onFilesUploaded={(files) => setPlaceFiles(files)}
              />
              <FileUpload
                title="환자별 수입 현황 업로드"
                onFilesUploaded={(files) => setPatient(files)}
              />
            </>
          )}
        </ContentContainer>

        {/* Button and Progress Bar */}
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
                disabled={isButtonDisabled()}
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
