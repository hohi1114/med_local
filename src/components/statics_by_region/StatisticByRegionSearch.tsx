import styled from "styled-components";
import { useRegionAnalysisStore } from "../../store/useRegionAnalysisStore";
import SearchInput from "../common/input/SearchInput";

const StatisticByRegionSearch = () => {
  const { setSearchWord, setData, setFilteredData, data } =
    useRegionAnalysisStore();

  const handleSearch = (searchWord: string) => {
    if (!searchWord) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter((item) => {
      item.region_name.includes(searchWord);
    });
    setFilteredData(filtered);
  };

  return (
    <SearchContainer>
      {/* <span className="title">검색하기</span> */}
      {/* <SearchInput handleInputChange={handleSearch} /> */}
    </SearchContainer>
  );
};
export default StatisticByRegionSearch;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  .title {
    font-weight: bold;
  }
`;
