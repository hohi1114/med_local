import { Divider } from "antd";
import ContentHeader from "../components/common/layout/ContentHeader";
import {
  CardTitle,
  CardWrapper,
  CenterWrapper,
  ContentWrapper,
  MembershipInfo
} from "./SettingPage";
import userStore from "../store/userStore";
import dayjs from "dayjs";
import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import BaseModal from "../components/common/modal/BaseModal";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { postBilling, postCancelSubscription } from "../utils/api/apis";
import Loading from "../components/common/Loading";
import useUpdateUserInfo from "../hooks/useUpdateUserInfo";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import usePaymentStore from "../store/usePaymenyStore";

function MembershipPage() {
  const { user } = userStore();

  const navigate = useNavigate();
  const { updateUserMembershipInfo } = useUpdateUserInfo();
  const { memberships } = usePaymentStore();
  const today = dayjs();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelSubscriptionModal, setCancelSubscriptionModal] = useState(false);
  const { mutate: cancelFreeTrialMutation, isPending: cancelFreeTrialPending } =
    useMutation({
      mutationFn: async () => await postCancelSubscription(),
      onSuccess: () => {
        setCancelModal(false);
        updateUserMembershipInfo();
      },
      onError: (err: AxiosError) => {
        alert((err.response?.data as { error?: string })?.error);
      }
    });
  const { mutate: startBillingMutation, isPending: startBillingPending } =
    useMutation({
      mutationFn: async () => await postBilling(),
      onSuccess: () => {
        setCancelModal(false);
        updateUserMembershipInfo();
      },
      onError: (err: AxiosError) => {
        alert((err.response?.data as { error?: string })?.error);
      }
    });

  const { mutate: cancelSubscription, isPending: cancelSubscriptionPending } =
    useMutation({
      mutationFn: async () => await postCancelSubscription(),
      onSuccess: () => {
        setCancelSubscriptionModal(false);
        updateUserMembershipInfo();
      },
      onError: (err: AxiosError) => {
        alert((err.response?.data as { error?: string })?.error);
      }
    });

  const handleCancelFreeTrial = () => {
    cancelFreeTrialMutation();
  };

  const handleBilling = () => {
    startBillingMutation();
  };

  const cancelSubscriptionHandler = () => {
    cancelSubscription();
  };

  const userPlan = memberships.find((plan) => plan.type === user?.plan);

  return (
    <>
      <BaseModal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        leftbuttonText="중지하기"
        rightbuttonText="멤버십 바로 시작하기"
        onClickLeft={handleCancelFreeTrial}
        onClickRight={handleBilling}
        title="정말 무료 체험 이용을 중지하시겠어요?"
      >
        {(cancelFreeTrialPending || startBillingPending) && <Loading />}
        무료 체험 이용을 중지하시면 등록되었던 멤버십 이용도 해지됩니다.
        <br />
        멤버십 바로 이용을 원하시면
        <strong> 멤버십 바로 시작하기</strong> 버튼을 눌러주세요.
      </BaseModal>

      <BaseModal
        isOpen={cancelSubscriptionModal}
        onClose={() => setCancelSubscriptionModal(false)}
        leftbuttonText="멤버십 해지하기"
        rightbuttonText="취소하기"
        title="정말 무료 체험 이용을 중지하시겠어요?"
        onClickLeft={cancelSubscriptionHandler}
        onClickRight={() => setCancelSubscriptionModal(false)}
      >
        {cancelSubscriptionPending && <Loading />}
        {(cancelFreeTrialPending || startBillingPending) && <Loading />}
        멤버십을 해지하시면 등록되었던 서비스 이용 불가능합니다.
        <br />
        멤버십 재가입을 원하시면
        <strong> 멤버십 시작</strong> 탭을 이용해주세요.
      </BaseModal>
      <ContentHeader title={"멤버십 관리"} />
      <CenterWrapper>
        <ContentWrapper>
          <CardWrapper>
            <CardTitle>맴버십 상세 정보</CardTitle>
            <Divider />
            <MembershipInfo>
              {user?.status === "active" ? (
                user?.is_free_trial && !today.isAfter(user?.trial_end_date) ? (
                  <PaymentInfoWrapper>
                    <TitleStyle>7일 무료 체험 이용중</TitleStyle>
                    <div className="sub_info">
                      이용 종료 일 : {user?.trial_end_date}
                    </div>
                    <ButtonWrapper>
                      <CancelButton
                        type="button"
                        onClick={() => setCancelModal(true)}
                      >
                        체험 종료
                      </CancelButton>
                    </ButtonWrapper>
                  </PaymentInfoWrapper>
                ) : (
                  <PaymentInfoWrapper>
                    <TitleStyle>{userPlan?.name} 멤버십</TitleStyle>
                    <div className="sub_info">
                      다음 결제일 : {user?.next_billing_date}
                    </div>
                    <ButtonWrapper>
                      <CancelButton
                        type="button"
                        onClick={() => setCancelSubscriptionModal(true)}
                      >
                        멤버십 해지
                      </CancelButton>
                    </ButtonWrapper>
                  </PaymentInfoWrapper>
                )
              ) : (
                <PaymentInfoWrapper>
                  <TitleStyle>
                    멤버십을 가입한 후 Orbis를 이용해 보세요!
                  </TitleStyle>
                </PaymentInfoWrapper>
              )}
            </MembershipInfo>
            {!dayjs(dayjs()).isBefore(user?.trial_end_date) && (
              <>
                <Divider />
                <NavigationWrapper
                  onClick={() => navigate("/membership-change")}
                >
                  <span className="title">
                    {user.status === "active" ? "멤버십 변경" : "멤버십 시작"}
                  </span>
                  <img
                    src="/images/simpleArrow.svg"
                    style={{ width: 28, height: 28 }}
                  />
                </NavigationWrapper>
              </>
            )}
          </CardWrapper>
          <CardWrapper>
            <CardTitle>결제 정보</CardTitle>
            <Divider />
            <NavigationWrapper onClick={() => navigate("/manage-card")}>
              <span className="title">결제 수단 관리</span>
              <img
                src="/images/simpleArrow.svg"
                style={{ width: 28, height: 28 }}
              />
            </NavigationWrapper>
            <Divider />
            <NavigationWrapper>
              <span className="title">결제 내역 확인</span>
              <img
                src="/images/simpleArrow.svg"
                style={{ width: 28, height: 28 }}
              />
            </NavigationWrapper>
          </CardWrapper>
        </ContentWrapper>
      </CenterWrapper>
    </>
  );
}

export default MembershipPage;

const PaymentInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.2rem 0.8rem;

  .sub_info {
    font-size: 1.3rem;
    color: ${(props) => props.theme.colors.gray05};
  }
`;

const TitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.black};
`;

const NavigationWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  .title {
    font-size: 1.3rem;
  }
`;

const ButtonWrapper = styled.div`
  max-width: 10rem;
`;

export const CancelButton = styled(BaseButton)`
  transition: 0.2s ease-in-out;
  background-color: ${(props) => props.theme.colors.gray02};
  color: ${(props) => props.theme.colors.black};
  &:hover {
    background: ${(props) => props.theme.colors.gray05};
  }
`;
