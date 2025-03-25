import { Modal } from "antd";
import styled from "styled-components";
import BaseButton from "../button/BaseButton";

interface BaseModalProps {
  isModalOpen: boolean;
  handleLicenseInput: (licenseInput: string) => void;
  handleComfirmButton: () => void;
  handleLicenseModal: () => void;
}
const LicenseModal = ({
  isModalOpen,
  handleLicenseInput,
  handleComfirmButton,
  handleLicenseModal
}: BaseModalProps) => {
  return (
    <Modal
      open={isModalOpen}
      footer={null}
      style={{ top: "30vh" }}
      onCancel={handleLicenseModal}
    >
      <ModalContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#0F52BA",
              padding: 10,
              borderRadius: "50%",
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)",
              width: "60px",
              height: "60px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <img
              src="/images/key.svg"
              style={{ width: "45px", height: "auto" }}
            />
          </div>
          <TitleText>라이센스 코드를 입력해주세요.</TitleText>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <BaseInput
            id="licenseCode"
            type="string"
            placeholder="License Code"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleLicenseInput(e.target.value)
            }
          />
          <div style={{ minWidth: "20rem" }}>
            <ConfirmButton type="submit" onClick={handleComfirmButton}>
              확인
            </ConfirmButton>
          </div>
        </div>
      </ModalContainer>
    </Modal>
  );
};

const BaseInput = styled.input`
  border: none;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 13px 10px;
  border-radius: 6px;
  min-width: 20rem;
  font-size: 1.2rem;
  transition: 0.2s ease-in-out;
  box-sizing: border-box;
`;
const ConfirmButton = styled(BaseButton)`
  transition: 0.2s ease-in-out;
  &:hover {
    background: #003366;
  }
`;

const ModalContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 10px;
  gap: 4rem;
`;
const TitleText = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

export default LicenseModal;
