import { useState } from "react";
import styled from "styled-components";
import { Select } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import { RangePickerProps } from "antd/es/date-picker";
import SearchInput from "../common/input/SearchInput";

const LOCALSECTIONS = ["시", "구", "동"];
const DashBoardFilter = () => {
  const [localSection, setlocalSection] = useState(LOCALSECTIONS[0]);
  const [rangeDate, setRangeDate] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [searchword, setSearchword] = useState<string | null>(null);

  const handleLocalSectionChange = (value: string) => {
    setlocalSection(value);
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates, _) => {
    if (dates && dates[0] && dates[1]) {
      setRangeDate({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate(),
      });
    }
  };
  const handleSearchwordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchword(e.target.value);
  };

  return (
    <FilterWrapper>
      {/* Left Filter Section */}
      <FilterContainer>
        <FilterItemContainer>
          <span className="title">분석기간</span>
          <DurationDatePicker
            rangeDate={rangeDate}
            handleDateChange={handleDateChange}
          />
        </FilterItemContainer>
        <FilterItemContainer>
          <span className="title">지역 단위</span>
          <Select
            onChange={handleLocalSectionChange}
            defaultValue={localSection}
          >
            {LOCALSECTIONS.map((section, index) => {
              return <Select.Option key={index}>{section}</Select.Option>;
            })}
          </Select>
        </FilterItemContainer>
      </FilterContainer>

      {/* Right Filter Section */}
      <SearchContainer>
        <span className="title">검색하기</span>
        <SearchInput handleInputChange={handleSearchwordChange} />
      </SearchContainer>
    </FilterWrapper>
  );
};

export default DashBoardFilter;

const FilterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: #ffffff;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1.7rem;
`;

const FilterItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  .title {
    font-weight: bold;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  .title {
    font-weight: bold;
  }
`;
