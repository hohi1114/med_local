import styled from "styled-components";
import usePaymentStore from "../../store/usePaymenyStore";
import {
  MemberShipWrapper,
  StartMembershipButton,
  TitleWrapper
} from "./style/membership.styles";
import { PAYMENT_TERMS } from "./FreeTrialModal";
import { useState } from "react";

const PaymentForm = () => {
  const { prevStep, selectedPlan } = usePaymentStore();
  const [isCheckedTerm, setIsCheckedTerm] = useState(false);
  return (
    <>
      <BackHeaderWrapper>
        <img
          src="/images/arrow.svg"
          style={{ width: 30, height: 30, cursor: "pointer" }}
          onClick={prevStep}
        />
        <TitleWrapper isAbsolute>
          <span className="modal-title" style={{ textAlign: "center" }}>
            결제
          </span>
        </TitleWrapper>
      </BackHeaderWrapper>
      <MemberShipWrapper>
        <SelectedMemberShipCard>
          <div className="plan-info">
            <span className="plan-name">{selectedPlan?.name}</span>
            <div className="plan-pricing">
              <span className="price-label">정기결제 (매월)</span>
              <span className="monthly-price">
                월 {selectedPlan?.amount.toLocaleString()} 원
              </span>
            </div>
            <div className="plan-pricing">
              <span className="plan-name">최종 결제 금액</span>
              <span className="result-price">
                {selectedPlan?.amount.toLocaleString()} 원
              </span>
            </div>
          </div>
        </SelectedMemberShipCard>
        <PaymentContainer>
          <PaymentTitle>간편 결제 등록</PaymentTitle>
          <PaymentBoxWrapper>
            <PaymentBox>
              <img src="/images/plus.svg" style={{ width: 30, height: 30 }} />
              <span>간편 결제 추가</span>
            </PaymentBox>
          </PaymentBoxWrapper>
        </PaymentContainer>
        <InfoContainer>
          {PAYMENT_TERMS.map((term) => {
            return (
              <InfoSection key={term.id}>
                <SectionTitle>{term.id}</SectionTitle>
                <InfoList>
                  {term.content.map((content, index) => {
                    return <li key={index}>{content}</li>;
                  })}
                </InfoList>
              </InfoSection>
            );
          })}
        </InfoContainer>
        <CheckboxWrapper>
          <CheckboxCircle
            checked={isCheckedTerm}
            onClick={() => setIsCheckedTerm(!isCheckedTerm)}
          >
            <img
              src={
                isCheckedTerm
                  ? "/images/check_white.svg"
                  : "/images/check_gray.svg"
              }
              alt="Checkbox"
            />
          </CheckboxCircle>

          <CheckboxLabel>
            가격 및 유의사항을 확인하였으며, 매월 정기결제에 동의합니다.
          </CheckboxLabel>
        </CheckboxWrapper>
        <StartMembershipButton type="submit">
          {selectedPlan?.amount.toLocaleString()}원 결제하기
        </StartMembershipButton>
      </MemberShipWrapper>
    </>
  );
};
export default PaymentForm;

export const BackHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SelectedMemberShipCard = styled.div`
  display: flex;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.colors.gray03};
  justify-content: space-between;

  .plan-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.6rem;
  }

  .plan-name {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.black};
  }

  .plan-pricing {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    text-align: right;
  }

  .monthly-price {
    font-size: 1.4rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.black01};
  }

  .price-label {
    font-size: 1.3rem;
    color: ${(props) => props.theme.colors.gray06};
  }

  .result-price {
    font-size: 1.6rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
  }
`;

const PaymentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PaymentTitle = styled.span`
  font-size: 1.4rem;
  font-weight: bold;
`;

const PaymentBoxWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const PaymentBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50%;
  height: 12rem;
  border: 1.5px solid ${(props) => props.theme.colors.gray04};
  border-radius: 8px;
  padding: 1rem;
  transition: border 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  img {
    width: 30px;
    height: 30px;
    margin-bottom: 0.5rem;
  }

  span {
    font-size: 1.2rem;
    color: ${(props) => props.theme.colors.black01};
  }
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray06};
`;

const SectionTitle = styled.span`
  font-weight: bold;
  font-size: 1.1rem;
`;

const InfoList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin-top: 0.5rem;

  li {
    position: relative;
    margin-bottom: 0.8rem;
    line-height: 1.2;
    padding-left: 20px;

    &::before {
      content: "-";
      position: absolute;
      left: 0;
      font-size: 1.2rem;
    }
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
`;

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
  width: 2rem;
  height: 2rem;
  border: 2px solid
    ${(props) =>
      props.checked ? props.theme.colors.primary : props.theme.colors.gray05};
`;

const CheckboxLabel = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;
