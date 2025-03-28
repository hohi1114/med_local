import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import ContentHeader from "../components/common/layout/ContentHeader";
import userStore from "../store/userStore";
import { logout } from "../utils/api/apihelper";
import BaseInput from "../components/common/input/BaseInput";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
export const MembershipType = [
  { id: "monthly", name: "1개월" },
  { id: "quarterly", name: "6개월" },
  { id: "yearly", name: "12개월" }
];

export default function SettingPage() {
  const { user } = userStore();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
  };
  const planName = MembershipType.find((plan) => plan.id === user?.plan)?.name;

  return (
    <>
      <ContentHeader title={"설정"} />
      <CenterWrapper>
        <ContentWrapper>
          <ProfileCard>
            <ProfileTitle>프로필</ProfileTitle>
            <Divider />
            <ProfileField>
              <ProfileImage src={"/images/defaultProfile.svg"} alt="Profile" />
            </ProfileField>
            <ProfileField>
              <BaseInput label="이메일" value={user?.email} disabled />
            </ProfileField>
            <ProfileField>
              <BaseInput label="병원이름" value={user?.name} disabled />
            </ProfileField>
          </ProfileCard>

          <ProfileCard>
            <ProfileTitle>멤버십</ProfileTitle>
            <Divider />
            <MembershipInfo>
              <MembershipDetails>
                {user?.subscribedStatus === "active" ? (
                  <>
                    <PlanInfo>
                      <PlanTitle>{planName} 플랜</PlanTitle>
                      <PlanStatus>
                        {user?.subscribedStatus === "active"
                          ? `다음 결제일: ${dayjs(user?.nextBillingDate).format(
                              "YYYY년 MM월 DD일"
                            )}`
                          : "결제정보 없음"}
                      </PlanStatus>
                    </PlanInfo>
                    <Price>월 39,999원</Price>
                  </>
                ) : (
                  <>
                    <PlanInfo>
                      <PlanTitle>멤버십 업데이트 필요</PlanTitle>
                    </PlanInfo>
                  </>
                )}
              </MembershipDetails>
              <ButtonWrapper>
                <MembershipButton
                  type="button"
                  onClick={() => navigate("/membership")}
                >
                  멤버십 관리
                </MembershipButton>
              </ButtonWrapper>
            </MembershipInfo>
          </ProfileCard>

          <LogoutButton type="submit" onClick={handleLogout}>
            Logout
          </LogoutButton>
        </ContentWrapper>
      </CenterWrapper>
    </>
  );
}

// 스타일 컴포넌트 정의
const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.2rem 0rem;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 60rem;
  width: 90%;
`;

const ProfileTitle = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${(props) => props.theme.colors.gray03};
  margin: 1.5rem 0rem 3rem 0rem;
`;

const ProfileCard = styled.div`
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

const MembershipInfo = styled.div`
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
