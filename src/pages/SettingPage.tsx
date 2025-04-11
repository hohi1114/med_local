import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import ContentHeader from "../components/common/layout/ContentHeader";
import userStore from "../store/userStore";
import { logout } from "../utils/api/apihelper";
import BaseInput from "../components/common/input/BaseInput";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import usePaymentStore from "../store/usePaymenyStore";

export default function SettingPage() {
  const { user, isFreetrialUser } = userStore();
  const { memberships } = usePaymentStore();
  const navigate = useNavigate();

  const userMembership = memberships.find((plan) => plan.type === user?.plan);
  const isActive = user?.status === "active";
  const isCanceled = user?.status === "canceled";

  const handleLogout = () => logout();
  const navigateToMembership = () => navigate("/membership");

  const renderMembershipContent = () => {
    if (isActive) {
      return (
        <>
          <PlanInfo>
            <PlanTitle>
              {userMembership?.name} 플랜{" "}
              {isFreetrialUser && (
                <span style={{ color: "#2a7ac2", fontWeight: "bold" }}>
                  (7일 무료체험 중)
                </span>
              )}
            </PlanTitle>
            <PlanStatus>
              다음 결제일:{" "}
              {dayjs(user?.next_billing_date).format("YYYY년 MM월 DD일")}
            </PlanStatus>
          </PlanInfo>
          <Price>월 {userMembership?.amount?.toLocaleString()}원</Price>
        </>
      );
    } else if (isCanceled) {
      return (
        <>
          <PlanInfo>
            <PlanTitle>{userMembership?.name} 플랜</PlanTitle>
            <PlanStatus>만료일: {user?.next_billing_date}</PlanStatus>
          </PlanInfo>
          <Price>월 {userMembership?.amount?.toLocaleString()}원</Price>
        </>
      );
    } else {
      return (
        <PlanInfo>
          <PlanTitle>멤버십 업데이트 필요</PlanTitle>
        </PlanInfo>
      );
    }
  };
  return (
    <>
      <ContentHeader title="계정" />
      <CenterWrapper>
        <ContentWrapper>
          <CardWrapper>
            <CardTitle>프로필</CardTitle>
            <Divider />
            <ProfileField>
              <ProfileImage src="/images/defaultProfile.svg" alt="Profile" />
            </ProfileField>
            <ProfileField>
              <BaseInput label="이메일" value={user?.email} disabled />
            </ProfileField>
            <ProfileField>
              <BaseInput label="병원이름" value={user?.name} disabled />
            </ProfileField>
          </CardWrapper>

          {!user?.free && (
            <CardWrapper>
              <CardTitle>멤버십</CardTitle>
              <Divider />
              <MembershipInfo>
                <MembershipDetails>
                  {renderMembershipContent()}
                </MembershipDetails>
                <ButtonWrapper>
                  <MembershipButton
                    type="button"
                    onClick={navigateToMembership}
                  >
                    멤버십 관리
                  </MembershipButton>
                </ButtonWrapper>
              </MembershipInfo>
            </CardWrapper>
          )}

          <LogoutButton type="submit" onClick={handleLogout}>
            로그아웃
          </LogoutButton>
        </ContentWrapper>
      </CenterWrapper>
    </>
  );
}

export const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.2rem 0rem;
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 60rem;
  width: 90%;
`;

export const CardTitle = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
`;

export const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${(props) => props.theme.colors.gray03};
  margin: 1.5rem 0rem 3rem 0rem;
`;

export const CardWrapper = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  padding: 2rem;
  border-radius: 6px;
  margin-bottom: 2rem;
`;

const ProfileField = styled.div`
  width: 100%;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const ProfileImage = styled.img`
  width: 5rem;
  height: auto;
`;

export const MembershipInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid ${(props) => props.theme.colors.gray03};
`;

const MembershipDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PlanInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PlanTitle = styled.span`
  font-weight: bold;
  font-size: 1.3rem;
`;

const PlanStatus = styled.span`
  font-size: 1.1rem;
  color: #2b2b2b;
`;

const Price = styled.div`
  font-weight: bold;
  font-size: 1.3rem;
`;

const ButtonWrapper = styled.div`
  max-width: 10rem;
`;

const LogoutButton = styled(BaseButton)`
  transition: 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme.colors.darkPrimary};
  }
`;

const MembershipButton = styled(BaseButton)`
  transition: 0.2s ease-in-out;
  background-color: ${(props) => props.theme.colors.gray02};
  color: ${(props) => props.theme.colors.black};
  &:hover {
    background: ${(props) => props.theme.colors.gray05};
  }
`;
