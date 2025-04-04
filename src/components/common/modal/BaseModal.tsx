import styled from "styled-components";
import { Modal } from "antd";
import BaseButton from "../button/BaseButton";

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  onClickRight?: () => void;
  onClickLeft?: () => void;
  leftbuttonText?: string;
  rightbuttonText?: string;
}

const MembershipModal = ({
  isOpen = true,
  onClose,
  onClickLeft,
  onClickRight,
  title,
  children,
  leftbuttonText = "취소",
  rightbuttonText = "확인"
}: MembershipModalProps) => {
  return (
    <StyledModal open={isOpen} footer={null} centered onCancel={onClose}>
      <ModalContent>
        <TitleText>{title}</TitleText>

        <HighlightText>{children}</HighlightText>
        <ButtonContainer>
          {onClickLeft && (
            <CancelButton type="button" onClick={onClickLeft}>
              {leftbuttonText}
            </CancelButton>
          )}
          {onClickRight && (
            <ConfirmButton type="button" onClick={onClickRight}>
              {rightbuttonText}
            </ConfirmButton>
          )}
        </ButtonContainer>
      </ModalContent>
    </StyledModal>
  );
};

export default MembershipModal;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 2rem;
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  width: 100%;
  margin-top: 0.5rem;
`;

const CancelButton = styled(BaseButton)`
  font-size: 1.1rem;
  height: 3.2rem;
  background-color: ${(props) => props.theme.colors.gray02};
  color: ${(props) => props.theme.colors.gray06};
`;

const ConfirmButton = styled(BaseButton)`
  font-size: 1.1rem;
  height: 3.2rem;
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
`;
const TitleText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const HighlightText = styled.span`
  font-size: 1.1rem;
  line-height: 1.5;
  color: ${(props) => props.theme.colors.gray05};
  margin: 0;

  strong {
    font-weight: 600;
  }
`;
