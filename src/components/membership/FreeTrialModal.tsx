import { Modal } from "antd";
import styled from "styled-components";
import BaseButton from "../common/button/BaseButton";

export const MembershipType = [
  { id: "monthly", name: "1개월", amount: 39999 },
  { id: "quarterly", name: "6개월", amount: 199999 },
  { id: "yearly", name: "12개월", amount: 399999 }
];

export const FreeTrialModal = () => {
  return (
    <Modal open={true} footer={null} closeIcon={null}>
      <FreeTrialModalContent>
        <TitleWrapper>
          <span className="modal-title">7일 무료 체험</span>
          <div className="modal-subtitle">
            <span>카드를 등록하고 7일간 무료 체험을 시작해보세요.</span>
            <span>* 7일 체험판 : 데이터 제한 1달</span>
          </div>
        </TitleWrapper>

        <MemberShipWrapper>
          {MembershipType.map((plan) => (
            <MembershipCard key={plan.id}>
              <div className="plan-info">
                <span className="plan-name">{plan.name}</span>
                <div className="plan-pricing">
                  <span className="original-price">
                    {plan.amount.toLocaleString()} 원
                  </span>
                  <span className="discounted-price">
                    {plan.amount.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </MembershipCard>
          ))}
          <span className="disclaimer">* 언제든 해지가 가능합니다.</span>
        </MemberShipWrapper>

        <StartMembershipButton type="button">
          무료 체험 시작하기
        </StartMembershipButton>
      </FreeTrialModalContent>
    </Modal>
  );
};

const FreeTrialModalContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: 2rem;
  background-color: ${(props) => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .modal-title {
    font-weight: bold;
    font-size: 1.8rem;
    color: ${(props) => props.theme.colors.primary};
  }

  .modal-subtitle {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    color: ${(props) => props.theme.colors.gray06};
  }
`;

const MemberShipWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MembershipCard = styled.div`
  display: flex;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.colors.gray03};
  justify-content: space-between;
  align-items: center;
  transition: border 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .plan-info {
    display: flex;
    flex-direction: column;
  }

  .plan-name {
    font-size: 1.4rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.black};
  }

  .plan-pricing {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .original-price {
    font-size: 1.2rem;
    text-decoration: line-through;
    color: ${(props) => props.theme.colors.gray05};
  }

  .discounted-price {
    font-size: 1.4rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
  }
`;

const StartMembershipButton = styled(BaseButton)`
  height: 4rem;
  font-size: 1.3rem;
  font-weight: bold;
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.white};
  border-radius: 8px;
  padding: 0.8rem 2rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => props.theme.colors.darkPrimary};
  }
`;
