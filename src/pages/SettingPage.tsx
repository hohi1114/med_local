import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import ContentHeader from "../components/common/layout/ContentHeader";
import userStore from "../store/userStore";
import { logout } from "../utils/api/apihelper";
import BaseInput from "../components/common/input/BaseInput";

export default function SettingPage() {
  const { user } = userStore();
  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <ContentHeader title={"설정"} />
      <CenterWrapper>
        <ContentWrapper>
          <ProfileTitle>프로필</ProfileTitle>
          <Divider />
          <ProfileCard>
            <ProfileField>
              <ProfileImage src={"/images/defaultProfile.svg"} alt="Profile" />
            </ProfileField>
            <ProfileField>
              <BaseInput label="이메일" value={user?.email} disabled />
            </ProfileField>
            <ProfileField>
              <BaseInput label="병원이름" value={user?.name} disabled />
            </ProfileField>

            <LogoutButton type="submit" onClick={handleLogout}>
              Logout
            </LogoutButton>
          </ProfileCard>
        </ContentWrapper>
      </CenterWrapper>
    </>
  );
}

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
  background-color: ${(props) => props.theme.colors.white01};
  margin: 1.5rem 0rem 3rem 0rem;
`;

const ProfileCard = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  padding: 2rem;
  border-radius: 6px;
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

const Label = styled.label`
  font-size: 1.1rem;
  font-weight: 500;
  color: ${(props) => props.theme.colors.black};
  margin-bottom: 0.5rem;
  display: block;
`;

const LogoutButton = styled(BaseButton)`
  transition: 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme.colors.darkPrimary};
  }
`;
