import styled from "styled-components";
import { fetchDataFromBackend } from "../../../utils/api/apis";
import { useState } from "react";
import { Button } from "antd";
import { BackendData } from "../../../types/medi-types";

interface ContentHeaderProps {
  title: string;
  onDataFetched?: (data: BackendData | undefined) => void; // Callback to pass data
}

const ContentHeaderRefresh = ({ title, onDataFetched }: ContentHeaderProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<string | null>(null);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchDataFromBackend();
      console.log(result);
      if (result?.merged_data) {
        setFetchedData(`데이터 개수: ${result.merged_data.length}개`);
        onDataFetched?.(result); // Pass data to parent
      } else {
        setFetchedData("데이터를 불러오는 데 실패했습니다.");
        onDataFetched?.(undefined);
      }
    } catch (error) {
      console.error("❌ Failed to fetch data:", error);
      setFetchedData("서버 오류");
      onDataFetched?.(undefined);
    }
    setLoading(false);
  };

  return (
    <ContentHeaderContainer>
      <TitleStyle>{title}</TitleStyle>
      <ButtonContainer>
        {fetchedData && <DataInfo>{fetchedData}</DataInfo>}
        <Button type="primary" onClick={handleFetchData} loading={loading}>
          데이터 불러오기
        </Button>
      </ButtonContainer>
    </ContentHeaderContainer>
  );
};

// Styled components remain the same
const ContentHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 5rem;
  background-color: #ffffff;
  padding: 0 1.25rem;
  border-bottom: 3px solid #fafafb;
`;

const TitleStyle = styled.span`
  font-weight: bold;
  font-size: 1.2rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-right: 5rem;
`;

const DataInfo = styled.span`
  font-size: 1rem;
  color: #666;
`;

export default ContentHeaderRefresh;