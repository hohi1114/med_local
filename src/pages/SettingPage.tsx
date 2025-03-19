import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import ContentHeader from "../components/common/layout/ContentHeader";
import userStore from "../store/userStore";
import { logout } from "../utils/api/apihelper";

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
              <Label>이메일</Label>
              <BaseInput id="email" type="email" disabled value={user?.email} />
            </ProfileField>
            <ProfileField>
              <Label>병원 이름</Label>
              <BaseInput
                id="hospitalName"
                type="text"
                disabled
                value={user?.name}
              />
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
  background-color: #ddd;
  margin-bottom: 1rem;
`;

const ProfileCard = styled.div`
  background-color: #ffffff;
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
  color: #555;
  margin-bottom: 0.5rem;
  display: block;
`;

const BaseInput = styled.input`
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 13px 10px;
  border-radius: 6px;
  min-width: 20rem;
  font-size: 1.2rem;
  transition: 0.2s ease-in-out;
  box-sizing: border-box;

  &:focus {
    border-color: #6a5acd;
    outline: none;
    box-shadow: 0 0 5px rgba(106, 90, 205, 0.3);
  }
`;

const LogoutButton = styled(BaseButton)`
  transition: 0.2s ease-in-out;
  &:hover {
    background: #5a4ec5;
  }
`;
