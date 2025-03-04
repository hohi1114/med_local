import styled from "styled-components";

interface ContentHeaderProps {
  title: string;
}

const ContentHeader = ({ title }: ContentHeaderProps) => {
  return (
    <ContentHeaderContainer>
      <TitleStyle>{title}</TitleStyle>
    </ContentHeaderContainer>
  );
};

const ContentHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 5rem;
  background-color: #ffffff;
  padding: 0 1.25rem;
`;

const TitleStyle = styled.span`
  font-weight: bold;
  font-size: 1.2rem;
`;

export default ContentHeader;
