import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import styled from "styled-components";
import dayjs from "dayjs";

import ContentHeader from "../components/common/layout/ContentHeader";
import BackHeader from "../components/common/layout/BackHeader";
import BaseButton from "../components/common/button/BaseButton";
import BaseModal from "../components/common/modal/BaseModal";
import Loading from "../components/common/Loading";
import { MembershipCard } from "../components/membership/style/membership.styles";

import userStore from "../store/userStore";
import usePaymentStore from "../store/usePaymenyStore";
import useUpdateUserInfo from "../hooks/useUpdateUserInfo";

import {
  changeSubscription,
  postBilling,
  postManageCancelSubscription
} from "../utils/api/apis";

// Types

function MembershipChangePage() {
  const navigate = useNavigate();
  const { user } = userStore();
  const { memberships } = usePaymentStore();
  const { updateUserMembershipInfo } = useUpdateUserInfo();

  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const isActiveOrCanceled =
    user?.status === "active" || user?.status === "canceled";

  // Find plan details
  const updatedPlan = memberships.find((plan) => plan.type === selectedPlan);
  const userPlan = memberships.find((plan) => plan.type === user?.plan);

  const handleError = (err: AxiosError) => {
    alert(
      (err.response?.data as { error?: string })?.error || "An error occurred"
    );
  };

  const { mutate: billingMutation, isPending: billingPending } = useMutation({
    mutationFn: postBilling,
    onSuccess: async () => {
      await updateUserMembershipInfo();
      navigate("/membership");
    },
    onError: handleError
  });

  const { mutate: manageCancelSubscription, isPending: manageCancelPending } =
    useMutation({
      mutationFn: postManageCancelSubscription,
      onSuccess: () => {
        if (selectedPlan) membershipChangeMutation(selectedPlan);
      },
      onError: handleError
    });

  const {
    mutate: membershipChangeMutation,
    isPending: membershipChangePending
  } = useMutation({
    mutationFn: changeSubscription,
    onSuccess: async () => {
      await updateUserMembershipInfo();
      navigate("/membership");
    },
    onError: handleError
  });

  useEffect(() => {
    if (user && isActiveOrCanceled) {
      setSelectedPlan(user?.next_plan || user?.plan);
    }
  }, [user, isActiveOrCanceled]);

  // Handle membership change  *status: active, canceled
  const handleChangeMembership = () => {
    if (!selectedPlan) return;

    if (user?.status === "canceled") {
      manageCancelSubscription();
    } else {
      membershipChangeMutation(selectedPlan);
    }
  };

  // Handle billing restart ==> *status: 체험 취소 후 바로 멤버십 시작
  const handleStartBilling = () => {
    if (selectedPlan) {
      billingMutation(selectedPlan);
    }
  };

  const isLoading =
    billingPending || membershipChangePending || manageCancelPending;

  return (
    <>
      <ContentHeader title="멤버십 변경" />
      <BackHeader />

      {/* Confirmation Modal */}
      <BaseModal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        leftbuttonText="취소하기"
        rightbuttonText={
          isActiveOrCanceled ? "멤버십 변경하기" : "멤버십 재시작"
        }
        onClickRight={
          isActiveOrCanceled ? handleChangeMembership : handleStartBilling
        }
        onClickLeft={() => setConfirmModal(false)}
        title={isActiveOrCanceled ? "새로운 멤버십 확정" : "멤버십 재시작 안내"}
      >
        {isActiveOrCanceled ? (
          <ModalContent>
            <MembershipInfo>
              <ModalTitleText>현재 멤버십</ModalTitleText>
              <PlanDetails>
                <PriceText>{userPlan?.name}</PriceText>
                <PriceText>{userPlan?.amount?.toLocaleString()} 원</PriceText>
              </PlanDetails>
            </MembershipInfo>

            <ArrowIcon src="/images/simpleArrow.svg" />

            <MembershipInfo>
              <ModalTitleText>새로운 멤버십</ModalTitleText>
              <PlanDetails>
                <PriceText>{updatedPlan?.name}</PriceText>
                <PriceText>
                  {updatedPlan?.amount?.toLocaleString()} 원
                </PriceText>
              </PlanDetails>
            </MembershipInfo>
          </ModalContent>
        ) : (
          <RestartContent>
            <ModalTitleText>
              멤버십을 다시 시작하면 즉시 결제가 진행됩니다.
            </ModalTitleText>

            <RestartDetails>
              <ModalTitleText>
                결제 금액:{" "}
                <PriceText>
                  {updatedPlan?.amount?.toLocaleString()} 원
                </PriceText>
              </ModalTitleText>

              <ModalTitleText>
                다음 결제일:{" "}
                <PriceText>
                  {dayjs()
                    .add(updatedPlan?.day ?? 0, "days")
                    .format("YYYY-MM-DD")}
                </PriceText>
              </ModalTitleText>
            </RestartDetails>
          </RestartContent>
        )}

        {isLoading && <Loading />}
      </BaseModal>

      <MembershipContainer>
        <MembershipWrapper>
          {memberships.map((plan) => (
            <MembershipCard
              key={plan.type}
              onClick={() => setSelectedPlan(plan.type)}
              selected={plan.type === selectedPlan}
            >
              <div className="plan-info">
                <span className="plan-name">{plan.name}</span>
                <div className="plan-pricing">
                  {plan?.original_amount && (
                    <span className="original-price">
                      {plan.original_amount.toLocaleString()} 원
                    </span>
                  )}
                  <span className="discounted-price">
                    {plan.amount.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </MembershipCard>
          ))}

          <BaseButton
            type="button"
            disabled={!selectedPlan}
            onClick={() => setConfirmModal(true)}
          >
            변경하기
          </BaseButton>
        </MembershipWrapper>
      </MembershipContainer>
    </>
  );
}

export default MembershipChangePage;

export const MembershipContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.colors.white};
  gap: 2rem;
  align-items: center;
  padding: 5rem 0;
`;

const MembershipWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  gap: 2rem;
  width: 60%;
  max-width: 600px;
`;

const MembershipInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 3rem;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const RestartContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const RestartDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PlanDetails = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ModalTitleText = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.black};
`;

const PriceText = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.darkPrimary};
`;

const ArrowIcon = styled.img`
  width: 28px;
  height: 28px;
  transform: rotate(90deg);
`;
