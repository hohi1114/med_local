import { useEffect, useState } from "react";
import ContentHeader from "../components/common/layout/ContentHeader";
import { MembershipType } from "../components/membership/FreeTrialModal";
import { MembershipCard } from "../components/membership/style/membership.styles";
import userStore from "../store/userStore";
import BaseButton from "../components/common/button/BaseButton";
import { useMutation } from "@tanstack/react-query";
import { changeSubscription, postBilling } from "../utils/api/apis";
import styled from "styled-components";
import BaseModal from "../components/common/modal/BaseModal";
import Loading from "../components/common/Loading";
import { useNavigate } from "react-router-dom";
import useUpdateUserInfo from "../hooks/useUpdateUserInfo";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import BackHeader from "../components/common/layout/BackHeader";

function MembershipChangePage() {
  const { user } = userStore();
  const navigate = useNavigate();
  const { updateUserMembershipInfo } = useUpdateUserInfo();
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { mutate: billingMutation, isPending: billingPending } = useMutation({
    mutationFn: async () => await postBilling(),
    onSuccess: async () => {
      await updateUserMembershipInfo();
      navigate("/membership");
    },
    onError: (err: AxiosError) => {
      alert((err.response?.data as { error?: string })?.error);
    }
  });

  const {
    mutate: membershipChangeMutation,
    isPending: membershipChangePending
  } = useMutation({
    mutationFn: async (params: string) => await changeSubscription(params),
    onSuccess: async () => {
      if (user.status === "inactive") {
        billingMutation();
      } else {
        navigate("/membership");
        await updateUserMembershipInfo();
      }
    },
    onError: (err: AxiosError) => {
      alert((err.response?.data as { error?: string })?.error);
    }
  });

  useEffect(() => {
    if (user && user.status === "active") {
      setSelectedPlan(user?.plan);
    }
  }, [user]);

  const handleChangeMembership = () => {
    if (selectedPlan) {
      membershipChangeMutation(selectedPlan);
    }
  };

  return (
    <>
      <ContentHeader title={"멤버십 변경"} />
      <BackHeader />
      <BaseModal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        leftbuttonText="취소하기"
        rightbuttonText={
          user.status === "active" ? "멤버십 변경하기" : "멤버십 재시작"
        }
        onClickRight={handleChangeMembership}
        onClickLeft={() => setConfirmModal(false)}
        title={
          user.status === "active" ? "새로운 멤버십 확정" : "멤버십 재시작 안내"
        }
      >
        {user.status === "active" ? (
          <>
            <MembershipInfo>
              <ModalTitleText>현재 멤버십</ModalTitleText>
              <PriceText>{}</PriceText>
            </MembershipInfo>
            <ArrowIcon src="/images/simpleArrow.svg" />
            <MembershipInfo>
              <ModalTitleText>새로운 멤버십</ModalTitleText>
              <PriceText>2000원</PriceText>
            </MembershipInfo>
          </>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}
          >
            <span>멤버십을 다시 시작하면 즉시 결제가 진행됩니다.</span>
            <div>
              <span>
                결제 금액: <strong>1000 원</strong>
              </span>
            </div>
            <div>
              <span>
                다음 결제일: <strong>{dayjs().format("YYYY-MM-DD")}</strong>
              </span>
            </div>
          </div>
        )}
        {billingPending || (membershipChangePending && <Loading />)}
      </BaseModal>

      <MembershipContainer>
        <MembershipWrapper>
          {MembershipType.map((plan) => {
            return (
              <MembershipCard
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                selected={selectedPlan ? plan.id === selectedPlan : false}
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
  align-items: flex-start;
  gap: 0.5rem;
  height: 3rem;
  justify-content: center;
  align-items: center;
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
