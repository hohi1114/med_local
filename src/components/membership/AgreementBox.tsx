import { useNavigate } from "react-router-dom";
import styled from "styled-components";

interface AgreementBoxProps {
  isChecked: boolean;
  content: string;
  setIsChecked: (isChecked: boolean) => void;
  moreInfoLink?: boolean;
}
const AgreementBox = ({
  isChecked,
  setIsChecked,
  content,
  moreInfoLink
}: AgreementBoxProps) => {
  const navigate = useNavigate();

  const handleClickPolicyInfo = () => {
    navigate("/payment-policy");
  };
  return (
    <CheckboxWrapper>
      <CheckboxCircle
        checked={isChecked}
        onClick={() => setIsChecked(!isChecked)}
      >
        <img
          src={isChecked ? "/images/check_white.svg" : "/images/check_gray.svg"}
          alt="Checkbox"
        />
      </CheckboxCircle>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center"
        }}
      >
        <CheckboxLabel>{content}</CheckboxLabel>
        {moreInfoLink && (
          <InfoLink onClick={handleClickPolicyInfo}>정보보기</InfoLink>
        )}
      </div>
    </CheckboxWrapper>
  );
};

export default AgreementBox;

const CheckboxWrapper = styled.div`
  display: flex;
  gap: 0.8rem;
  align-items: center;
`;

const CheckboxCircle = styled.div<{ checked?: boolean }>`
  cursor: pointer;
  border-radius: 50%;
  background-color: ${(props) =>
    props.checked ? props.theme.colors.primary : props.theme.colors.white};
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border: 2px solid
    ${(props) =>
      props.checked ? props.theme.colors.primary : props.theme.colors.gray05};
`;

const CheckboxLabel = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const InfoLink = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray05};
  cursor: pointer;
  text-decoration: underline;
`;
