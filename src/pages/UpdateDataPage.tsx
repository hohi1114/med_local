import { useState } from "react";
import FileUpload from "../components/upload_data/FileUpload.tsx";
import { parseDaysFiles, parsePlaceFiles } from "../utils/ExcelParser.ts";
import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import { loadNaverMapsScript } from "../utils/NaverGeocode";
import { useEffect } from "react";
import { Progress, notification } from "antd";
import UploadedCalendar from "../components/upload_data/UploadedCalendar.tsx";
import Loading from "../components/common/Loading.tsx";
import { uploadDataToBackend } from "../utils/api/apis";
import ContentHeader from "../components/common/layout/ContentHeader.tsx";

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

  // ✅ Load Naver Maps Script on Component Mount
  useEffect(() => {
    loadNaverMapsScript(import.meta.env.VITE_NAVER_MAPS_CLIENT_ID)
      .then(() => {})
      .catch((error) =>
        console.error("❌ Failed to load Naver Maps script:", error)
      );
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
  const handleProcessData = async () => {
    if (!placeFiles || !daysFiles) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    try {
      // Parse files
      const visits = await parseDaysFiles(daysFiles);
      const patients = await parsePlaceFiles(placeFiles);
      setProgress(20);

      // Simulate progress for parsing
      setProgress(40);

      // Upload to backend (token is handled by authApi interceptor)
      const backendResponse = await uploadDataToBackend(visits, patients);
      setProgress(100);

      // Update local data count
      setLocalData(visits.length); // Adjust as needed

      console.log(
        `✅ Backend response: ${backendResponse.message}, Processed: ${backendResponse.processedRecords}`
      );
    } catch (error) {
      console.error("❌ Error processing data:", error);
      openNotification(
        "error",
        "데이터 처리 실패",
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다."
      );
      setProgress(0); // Reset progress on error
    }
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
