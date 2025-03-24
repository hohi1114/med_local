import { FC } from "react";
import styled from "styled-components";
import { Select } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import SearchInput from "../common/input/SearchInput";
import { RangeDate } from "../../hooks/useRangeDurationDatePicker";
import { LOCAL_SECTIONS_MAP } from "../../hooks/useRegionAnalysis";
import { Dayjs } from "dayjs";
import { useRegionAnalysisStore } from "../../store/useRegionAnalysisStore";
import StatisticByRegionSearch from "./StatisticByRegionSearch";

interface StatisticByRegionFilterProps {
  rangeDate: RangeDate;
  handleDateChange: (data: { startDate: Dayjs; endDate: Dayjs }) => void;
  handleLocalSectionChange: (value: keyof typeof LOCAL_SECTIONS_MAP) => void;
}
const StatisticByRegionFilter: FC<StatisticByRegionFilterProps> = (props) => {
  const { rangeDate, handleDateChange, handleLocalSectionChange } = props;
  const { localSection } = useRegionAnalysisStore();

  return (
    <FilterWrapper>
      {/* Left Filter Section */}
      <FilterContainer>
        <FilterItemContainer>
          <span className="title">분석기간</span>
          <DurationDatePicker
            rangeDate={rangeDate}
            handleDateChange={(date) => {
              if (date?.length === 2 && date[0] && date[1]) {
                handleDateChange({ startDate: date[0], endDate: date[1] });
              }
            }}
          />
        </FilterItemContainer>
        <FilterItemContainer>
          <span className="title">지역 단위</span>
          <Select
            onChange={handleLocalSectionChange}
            defaultValue={localSection}
          >
            {Object.keys(LOCAL_SECTIONS_MAP).map((section, index) => {
              return (
                <Select.Option key={index} value={section}>
                  {section}
                </Select.Option>
              );
            })}
          </Select>
        </FilterItemContainer>
      </FilterContainer>

      {/* Right Filter Section */}
      <StatisticByRegionSearch />
    </FilterWrapper>
  );
};

export default StatisticByRegionFilter;

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
