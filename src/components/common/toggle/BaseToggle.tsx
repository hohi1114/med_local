import React, { useState } from "react";
import styled from "styled-components";

// Segmented Control 컴포넌트
const CustomSegmentedControl = ({ options, handleToggle, selectedValue }) => {
  // 선택된 값의 상태를 관리

  return (
    <SegmentedContainer>
      {options.map((option) => (
        <SegmentItem
          key={option.value}
          isSelected={selectedValue === option}
          onClick={() => handleToggle(option)}
        >
          {option.label}
        </SegmentItem>
      ))}
    </SegmentedContainer>
  );
};

export default CustomSegmentedControl;

// 세그먼트 항목을 스타일링한 컴포넌트
const SegmentedContainer = styled.div`
  display: flex;
  border: 1px solid #ccc;
  border-radius: 20px;
  overflow: hidden;
`;

const SegmentItem = styled.div<{ isSelected: boolean }>`
  padding: 10px 20px;
  cursor: pointer;
  background-color: ${(props) => (props.isSelected ? "#0f52ba" : "#fff")};
  color: ${(props) => (props.isSelected ? "#fafafa" : "#333")};
  border-right: ${(props) => (props.isSelected ? "none" : "1px solid #ccc")};
  font-weight: ${(props) => (props.isSelected ? "bold" : "normal")};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.isSelected ? "#0d4a97" : "#f0f0f0")};
  }

  &:last-child {
    border-right: none;
  }
`;
