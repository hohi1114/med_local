import styled from "styled-components";
import { fetchDataFromBackend } from "../../../utils/backendData";
import { useState } from "react";
import { Button } from "antd";

interface ContentHeaderProps {
  title: string;
}

const ContentHeaderRefresh = ({ title }: ContentHeaderProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<string | null>(null);

  // 🔹 Fetch Data on Button Click
  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchDataFromBackend();
      if (result) {
        setFetchedData(`데이터 개수: ${result.merged_data.length}개`);
      } else {
        setFetchedData("데이터를 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ Failed to fetch data:", error);
      setFetchedData("서버 오류");
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

const ContentHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between; /* Changed to space-between to push button to right */
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