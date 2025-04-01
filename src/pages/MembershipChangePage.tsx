import { useEffect, useState } from "react";
import ContentHeader from "../components/common/layout/ContentHeader";
import { MembershipType } from "../components/membership/FreeTrialModal";
import { MembershipCard } from "../components/membership/style/membership.styles";
import userStore from "../store/userStore";
import BaseButton from "../components/common/button/BaseButton";

type PaymentPlanType = (typeof MembershipType)[number];
function MembershipChangePage() {
  const { user } = userStore();
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanType | null>(
    null
  );

  useEffect(() => {
    if (user) {
      setSelectedPlan(user?.plan as unknown as PaymentPlanType);
    }
  }, [user]);

  return (
    <>
      <ContentHeader title={"멤버십 변경"} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          gap: "2rem",
          alignItems: "center",
          padding: "5rem 0rem"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white",
            gap: "2rem",
            width: "60%"
          }}
        >
          {MembershipType.map((plan) => {
            return (
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
            );
          })}
          <BaseButton type="button">변경하기</BaseButton>
        </div>
      </div>
    </>
  );
}

export default MembershipChangePage;
