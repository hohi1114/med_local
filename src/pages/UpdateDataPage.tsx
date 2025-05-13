import { useState } from "react";
import FileUpload from "../components/upload_data/FileUpload.tsx";
import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import { loadNaverMapsScript } from "../utils/NaverGeocode";
import { useEffect } from "react";
import { Progress, notification } from "antd";
import UploadedCalendar from "../components/upload_data/UploadedCalendar.tsx";
import Loading from "../components/common/Loading.tsx";
import { getUserEMR } from "../utils/api/apis";
import ContentHeader from "../components/common/layout/ContentHeader.tsx";
import RequireSubscribe from "../components/common/RequireSubscribe.tsx";
import { getCookie } from "../utils/api/cookie.ts";
import {
  ProcessedPatientData,
  DateLocationGroup,
} from "../local/locationProcessing.ts";
import axios from "axios";
import useUpdateUserInfo from "../hooks/useUpdateUserInfo.tsx";

interface ProcessDataResponse {
  status: string;
  message: string;
  mergedRecordCount: number;
  filteredRecordCount: number;
  uniqueDatesCount: number;
  totalDatesCount: number;
  locationGroupsCount: number;
}
interface ProcessDataPayload {
  patient_records: ProcessedPatientData[];
  date_location_groups: DateLocationGroup[];
}

/**
 * Processes patient data by sending it to the backend for processing
 * @param token Authentication token
 * @param processedRecords Array of processed patient records
 * @param dateLocationGroups Array of date and location group data
 * @returns Promise with the processing results
 */
export async function uploadDataToBackend(
  token: string,
  processedData: ProcessDataPayload
): Promise<ProcessDataResponse> {
  try {
    const baseURL = "http://localhost:3001/api";

    // Prepare the request payload
    const payload = {
      processedRecords: processedData.patient_records,
      date_location_groups: processedData.date_location_groups
    };

    // Send the request to the backend
    const response = await axios.post<ProcessDataResponse>(
      `${baseURL}/data/process`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Patient data processed successfully:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("❌ Error processing patient data:", error.response.data);
      throw new Error(
        error.response.data.error || "Failed to process patient data"
      );
    } else {
      console.error("❌ Unexpected error processing patient data:", error);
      throw new Error(
        "An unexpected error occurred while processing patient data"
      );
    }
  }
}

const UpdateDataPage = () => {
  const [dataType, setDataType] = useState<"euisarang" | "egis" | "dentweb" | "orm" | "vegas">(
    "euisarang"
  ); // Track data type
  const [daysFiles, setDaysFiles] = useState<FileList | null>(null); // Euisarang
  const [placeFiles, setPlaceFiles] = useState<FileList | null>(null); // Euisarang & Egis
  const [dailyIncome, setDailyIncome] = useState<FileList | null>(null); // Egis
  const [progress, setProgress] = useState<number>(0);
  const [api, contextHolder] = notification.useNotification();
  const { fetchUploadedDates } = useUpdateUserInfo();

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
        if (
          emrType === "euisarang" ||
          emrType === "egis" ||
          emrType === "dentweb" ||
          emrType === "orm" ||
          emrType === "vegas"
        ) {
          setDataType(emrType);
        }
      } catch (error) {
        console.error("❌ Error fetching EMR type:", error);
      }
    };

    fetchEMRType();
  }, []);

  const handleProcessDataDentweb = async (): Promise<void> => {
    if (!placeFiles || !daysFiles) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    const removeProgressListener = window.electron.onGeocodingProgress(
      ({ current, total }) => {
        // Calculate overall progress (giving geocoding 60% of the total weight)
        // First 20% for file processing and merging, last 20% for final processing and upload prep
        const geocodingProgress = (current / total) * 80;
        setProgress(10 + geocodingProgress);
      }
    );

    try {
      // Step 1: Convert files to ArrayBuffers for local processing
      const daysBuffers = await Promise.all(
        Array.from(daysFiles).map((file) => file.arrayBuffer())
      );

      const placeBuffers = await Promise.all(
        Array.from(placeFiles).map((file) => file.arrayBuffer())
      );

      // Step 2: Parse files locally via Electron
      const visits = await window.electron.parseDaysFilesDentweb(daysBuffers);

      const patients = await window.electron.parsePlaceFilesDentWeb(
        placeBuffers
      );

      console.log(visits);
      console.log(patients);
      // Step 3: Merge data locally
      const mergedData = await window.electron.mergeDataDentWeb(
        visits,
        patients
      );

      setProgress(10);

      // Step 4: Process the merged data (geocoding, region assignment, etc.)
      const processedData = await window.electron.processDataLocally(
        mergedData,
        getCookie("accessToken")
      );

      removeProgressListener();

      setProgress(90);

      console.log("Processed data:", processedData);

      // Step 5: Send only the processed data to the backend
      // Start the upload but don't await it
      const uploadPromise = uploadDataToBackend(
        getCookie("accessToken"),
        processedData
      );

      setProgress(95);

      // Inform the user that data is being processed in the background
      openNotification(
        "success",
        "데이터 업로드 중",
        "데이터가 처리되어 업로드 중입니다. 업로드가 완료되면 알려드립니다. 프로그램을 종료하지 마세요."
      );

      // Set progress to 100% since from the user's perspective, the task is complete
      setProgress(100);

      uploadPromise
        .then((backendResponse) => {
          fetchUploadedDates();
          // Handle successful upload (when it eventually completes)
          openNotification(
            "success",
            "데이터 업로드 완료",
            "모든 데이터가 성공적으로 처리되었습니다."
          );

          // Update any UI components that should reflect the successful upload
          // updateDataCount(backendResponse);
        })
        .catch((error) => {
          // Handle error in the background
          console.error("❌ Background upload error:", error);
          openNotification(
            "error",
            "업로드 실패",
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          );
        });
    } catch (error) {
      // This catch block handles errors in the processing phase
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

  const handleProcessDataEuisarang = async (): Promise<void> => {
    if (!placeFiles || !daysFiles) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    const removeProgressListener = window.electron.onGeocodingProgress(
      ({ current, total }) => {
        // Calculate overall progress (giving geocoding 60% of the total weight)
        // First 20% for file processing and merging, last 20% for final processing and upload prep
        const geocodingProgress = (current / total) * 80;
        setProgress(10 + geocodingProgress);
      }
    );

    try {
      // Step 1: Convert files to ArrayBuffers for local processing
      const daysBuffers = await Promise.all(
        Array.from(daysFiles).map((file) => file.arrayBuffer())
      );

      const placeBuffers = await Promise.all(
        Array.from(placeFiles).map((file) => file.arrayBuffer())
      );

      // Step 2: Parse files locally via Electron
      const visits = await window.electron.parseDaysFilesEuisarang(daysBuffers);

      const patients = await window.electron.parsePlaceFilesEuisarang(
        placeBuffers
      );


      console.log(visits);
      console.log(patients);

      // Step 3: Merge data locally
      const mergedData = await window.electron.mergeDataEuisarang(
        visits,
        patients
      );

      setProgress(10);

      // Step 4: Process the merged data (geocoding, region assignment, etc.)
      const processedData = await window.electron.processDataLocally(
        mergedData,
        getCookie("accessToken")
      );

      console.log("Processed data:", processedData);

      removeProgressListener();

      setProgress(90);

      // Step 5: Send only the processed data to the backend
      // Start the upload but don't await it
      const uploadPromise = uploadDataToBackend(
        getCookie("accessToken"),
        processedData
      );

      setProgress(95);

      // Inform the user that data is being processed in the background
      openNotification(
        "success",
        "데이터 업로드 중",
        "데이터가 처리되어 업로드 중입니다. 업로드가 완료되면 알려드립니다. 프로그램을 종료하지 마세요."
      );

      // Set progress to 100% since from the user's perspective, the task is complete
      setProgress(100);

      uploadPromise
        .then((backendResponse) => {
          fetchUploadedDates();
          // Handle successful upload (when it eventually completes)
          openNotification(
            "success",
            "데이터 업로드 완료",
            "모든 데이터가 성공적으로 처리되었습니다."
          );

          // Update any UI components that should reflect the successful upload
          // updateDataCount(backendResponse);
        })
        .catch((error) => {
          // Handle error in the background
          console.error("❌ Background upload error:", error);
          openNotification(
            "error",
            "업로드 실패",
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          );
        });
    } catch (error) {
      // This catch block handles errors in the processing phase
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



  const handleProcessDataOrm = async (): Promise<void> => {
    if (!placeFiles || !daysFiles) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    const removeProgressListener = window.electron.onGeocodingProgress(
      ({ current, total }) => {
        // Calculate overall progress (giving geocoding 60% of the total weight)
        // First 20% for file processing and merging, last 20% for final processing and upload prep
        const geocodingProgress = (current / total) * 80;
        setProgress(10 + geocodingProgress);
      }
    );

    try {
      // Step 1: Convert files to ArrayBuffers for local processing
      const daysBuffers = await Promise.all(
        Array.from(daysFiles).map((file) => file.arrayBuffer())
      );

      const placeBuffers = await Promise.all(
        Array.from(placeFiles).map((file) => file.arrayBuffer())
      );

      // Step 2: Parse files locally via Electron
      const visits = await window.electron.parseDaysFilesOrm(daysBuffers);

      const patients = await window.electron.parsePlaceFilesOrm(
        placeBuffers
      );


      // Step 3: Merge data locally
      const mergedData = await window.electron.mergeDataOrm(
        visits,
        patients
      );


      setProgress(10);

      // Step 4: Process the merged data (geocoding, region assignment, etc.)
      const processedData = await window.electron.processDataLocally(
        mergedData,
        getCookie("accessToken")
      );

      console.log("Processed data:", processedData);

      removeProgressListener();

      setProgress(90);

      // Step 5: Send only the processed data to the backend
      // Start the upload but don't await it
      const uploadPromise = uploadDataToBackend(
        getCookie("accessToken"),
        processedData
      );

      setProgress(95);

      // Inform the user that data is being processed in the background
      openNotification(
        "success",
        "데이터 업로드 중",
        "데이터가 처리되어 업로드 중입니다. 업로드가 완료되면 알려드립니다. 프로그램을 종료하지 마세요."
      );

      // Set progress to 100% since from the user's perspective, the task is complete
      setProgress(100);

      uploadPromise
        .then((backendResponse) => {
          fetchUploadedDates();
          // Handle successful upload (when it eventually completes)
          openNotification(
            "success",
            "데이터 업로드 완료",
            "모든 데이터가 성공적으로 처리되었습니다."
          );

          // Update any UI components that should reflect the successful upload
          // updateDataCount(backendResponse);
        })
        .catch((error) => {
          // Handle error in the background
          console.error("❌ Background upload error:", error);
          openNotification(
            "error",
            "업로드 실패",
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          );
        });
    } catch (error) {
      // This catch block handles errors in the processing phase
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


  const handleProcessDataEgis = async (): Promise<void> => {
    if (!placeFiles || !dailyIncome) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    const removeProgressListener = window.electron.onGeocodingProgress(
      ({ current, total }) => {
        // Calculate overall progress (giving geocoding 60% of the total weight)
        // First 20% for file processing and merging, last 20% for final processing and upload prep
        const geocodingProgress = (current / total) * 80;
        setProgress(10 + geocodingProgress);
      }
    );

    try {
      const daysBuffers = await Promise.all(
        Array.from(dailyIncome).map((file) => file.arrayBuffer())
      );

      const placeBuffers = await Promise.all(
        Array.from(placeFiles).map((file) => file.arrayBuffer())
      );

      // Step 2: Parse files locally via Electron
      const visits = await window.electron.parseDailyIncomeEgis(daysBuffers);

      console.log(visits);
      const patients = await window.electron.parsePatientListEgis(placeBuffers);
      console.log(patients);




      // Step 3: Merge data locally
      const mergedData = await window.electron.mergeDataEgis(visits, patients);

      setProgress(10);

      // Step 4: Process the merged data (geocoding, region assignment, etc.)
      const processedData = await window.electron.processDataLocally(
        mergedData,
        getCookie("accessToken")
      );


      removeProgressListener();

      setProgress(90);

      console.log("Processed data:", processedData);

      // Step 5: Send only the processed data to the backend
      // Start the upload but don't await it
      const uploadPromise = uploadDataToBackend(
        getCookie("accessToken"),
        processedData
      );

      setProgress(95);

      // Inform the user that data is being processed in the background
      openNotification(
        "success",
        "데이터 업로드 중",
        "데이터가 처리되어 업로드 중입니다. 업로드가 완료되면 알려드립니다. 프로그램을 종료하지 마세요."
      );

      // Set progress to 100% since from the user's perspective, the task is complete
      setProgress(100);

      uploadPromise
        .then((backendResponse) => {
          fetchUploadedDates();
          // Handle successful upload (when it eventually completes)
          openNotification(
            "success",
            "데이터 업로드 완료",
            "모든 데이터가 성공적으로 처리되었습니다."
          );

          // Update any UI components that should reflect the successful upload
          // updateDataCount(backendResponse);
        })
        .catch((error) => {
          // Handle error in the background
          console.error("❌ Background upload error:", error);
          openNotification(
            "error",
            "업로드 실패",
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          );
        });
    } catch (error) {
      // This catch block handles errors in the processing phase
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



  const handleProcessDataVegas = async (): Promise<void> => {
    if (!placeFiles || !dailyIncome) {
      openNotification("warning", "파일 누락", "모든 파일을 업로드해주세요.");
      return;
    }

    setProgress(1); // Start progress

    const removeProgressListener = window.electron.onGeocodingProgress(
      ({ current, total }) => {
        // Calculate overall progress (giving geocoding 60% of the total weight)
        // First 20% for file processing and merging, last 20% for final processing and upload prep
        const geocodingProgress = (current / total) * 80;
        setProgress(10 + geocodingProgress);
      }
    );

    try {
      const daysBuffers = await Promise.all(
        Array.from(dailyIncome).map((file) => file.arrayBuffer())
      );

      const placeBuffers = await Promise.all(
        Array.from(placeFiles).map((file) => file.arrayBuffer())
      );

      // Step 2: Parse files locally via Electron
      const visits = await window.electron.parseDailyIncomeVegas(daysBuffers);

      console.log(visits);
      const patients = await window.electron.parsePatientListVegas(placeBuffers);
      console.log(patients);


      // Step 3: Merge data locally
      const mergedData = await window.electron.mergeDataVegas(visits, patients);

      setProgress(10);

      // Step 4: Process the merged data (geocoding, region assignment, etc.)
      const processedData = await window.electron.processDataLocally(
        mergedData,
        getCookie("accessToken")
      );


      removeProgressListener();

      setProgress(90);

      console.log("Processed data:", processedData);

      // Step 5: Send only the processed data to the backend
      // Start the upload but don't await it
      const uploadPromise = uploadDataToBackend(
        getCookie("accessToken"),
        processedData
      );

      setProgress(95);

      // Inform the user that data is being processed in the background
      openNotification(
        "success",
        "데이터 업로드 중",
        "데이터가 처리되어 업로드 중입니다. 업로드가 완료되면 알려드립니다. 프로그램을 종료하지 마세요."
      );

      // Set progress to 100% since from the user's perspective, the task is complete
      setProgress(100);

      uploadPromise
        .then((backendResponse) => {
          fetchUploadedDates();
          // Handle successful upload (when it eventually completes)
          openNotification(
            "success",
            "데이터 업로드 완료",
            "모든 데이터가 성공적으로 처리되었습니다."
          );

          // Update any UI components that should reflect the successful upload
          // updateDataCount(backendResponse);
        })
        .catch((error) => {
          // Handle error in the background
          console.error("❌ Background upload error:", error);
          openNotification(
            "error",
            "업로드 실패",
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          );
        });
    } catch (error) {
      // This catch block handles errors in the processing phase
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

  const handleProcessData = () => {
    if (dataType === "euisarang") {
      handleProcessDataEuisarang();
    } else if (dataType === "egis") {
      handleProcessDataEgis();
    } else if (dataType === "dentweb") {
      handleProcessDataDentweb();
    } else if (dataType === "orm") {
      handleProcessDataOrm();
    } else {
      handleProcessDataVegas();
    }
  }


  const isButtonDisabled = () => {
    if (dataType === "euisarang" || dataType === "dentweb" || dataType === "orm") {
      return !daysFiles || !placeFiles || progress > 0;
    }
    return !dailyIncome || !placeFiles || progress > 0;
  };

  return (
    <>
      <RequireSubscribe />
      {progress > 0 && progress < 100 && (
        <Loading content="데이터를 안전하게 처리중입니다." />
      )}
      {contextHolder}
      <ContentHeader title={"데이터 업데이트"} />
      <UpdateDataContainer>
        <div style={{ marginBottom: "4rem" }}>
          <ContentContainer>
            <TitleStyle>저장한 데이터 현황</TitleStyle>
            <UploadedCalendar progress={progress} />
          </ContentContainer>
        </div>

        {/* Conditional File Uploads */}
        <ContentContainer>
          {dataType === "euisarang" && (
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
          )}

          {dataType === "dentweb" && (
            <>
              <FileUpload
                title="일일 진료비 통계 업로드"
                onFilesUploaded={(files) => setDaysFiles(files)}
              />
              <FileUpload
                title="내원 환자 지역별 분포 업로드"
                onFilesUploaded={(files) => setPlaceFiles(files)}
              />
            </>
          )}

          {dataType === "egis" && (
            <>
              <FileUpload
                title="일자별 수입 현황 업로드"
                onFilesUploaded={(files) => setDailyIncome(files)}
              />
              <FileUpload
                title="환자 목록 업로드"
                onFilesUploaded={(files) => setPlaceFiles(files)}
              />
            </>
          )}

          {dataType === "orm" && (
            <>
              <FileUpload
                title="일일 수입 데이터 업로드 (환자 집계)"
                onFilesUploaded={(files) => setDaysFiles(files)}
              />
              <FileUpload
                title="장소별 환자 데이터 업로드 (환자 정보 자료 생성)"
                onFilesUploaded={(files) => setPlaceFiles(files)}
              />
            </>
          )}

          {dataType === "vegas" && (
            <>
              <FileUpload
                title="환자별 집계"
                onFilesUploaded={(files) => setDailyIncome(files)}
              />
              <FileUpload
                title="DM 주소록"
                onFilesUploaded={(files) => setPlaceFiles(files)}
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
