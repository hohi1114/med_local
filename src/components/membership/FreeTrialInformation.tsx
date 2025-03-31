import usePaymentStore from "../../store/usePaymenyStore";
import { MembershipType } from "./FreeTrialModal";
import {
  FreeTrialModalContent,
  TitleWrapper,
  MemberShipWrapper,
  MembershipCard,
  StartMembershipButton
} from "./style/membership.styles";

const FreeTrialInformation = () => {
  const { selectedPlan, nextStep, setSelectedPlan } = usePaymentStore();
  return (
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
          <MembershipCard
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            selected={plan.id === selectedPlan?.id}
          >
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
      <StartMembershipButton
        type="button"
        onClick={nextStep}
        disabled={!selectedPlan}
      >
        무료 체험 시작하기
      </StartMembershipButton>
    </FreeTrialModalContent>
  );
};
export default FreeTrialInformation;
