import styled from "styled-components";
import { Select, Input } from "antd";
import { useState } from "react";
import DurationDatePicker from "../datepicker/DurationDatePicker";

const LOCALSECTIONS = ["시", "구", "동"];
const DashBoardFilter = () => {
  const [localSection, setlocalSection] = useState(LOCALSECTIONS[0]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleLocalSectionChange = (value: string) => {
    setlocalSection(value);
  };

  const handleDateChange = () => {};

  return (
    <FilterWrapper>
      {/* Left Filter Section */}
      <FilterContainer>
        <FilterItemContainer>
          <span className="title">분석기간</span>
          <DurationDatePicker
            startDate={startDate}
            endDate={endDate}
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
        <Input placeholder="Search" />
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
