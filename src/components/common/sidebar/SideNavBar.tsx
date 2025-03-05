import { Menu, MenuProps } from "antd";
import { MENUITEMS } from "./sidebarData";
import styled from "styled-components";
import {useNavigate} from "react-router-dom";

const SideNavBar = () => {

    const navigate = useNavigate(); // ✅ 페이지 이동을 위한 훅

    const onClick: MenuProps["onClick"] = (e) => {
        console.log("click ", e);
        navigate(`/${e.key}`); // ✅ 클릭한 메뉴의 key 값으로 이동
    };

  /*
  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
  };
  */


  return (
    <SidbarContainer>
      <LogoContainer>
        <IconStyle src="/images/defaultProfile.svg" alt="default_profile" />
        <span>Logo</span>
      </LogoContainer>

      <Menu
        onClick={onClick}
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        mode="inline"
        items={MENUITEMS}
        style={{ flex: 1, overflowY: "auto" }}
      />

      <SettingContainer>
        <IconStyle src="/images/settings.svg" alt="settings" />
        설정
      </SettingContainer>
    </SidbarContainer>
  );
};

const LogoContainer = styled.div`
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SettingContainer = styled.div`
  position: absolute;
  bottom: 2.8rem;
  left: 1.5rem;
  width: 100%;
  display: flex;
  gap: 0.8rem;
  align-items: center;
  font-size: 1.3rem;
  cursor: pointer;
`;

const SidbarContainer = styled.div`
  width: 20rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: "relative";
  box-shadow: "0px 4px 4px rgba(0, 0, 0, 0.25)";
  background-color: #ffffff;
`;

const IconStyle = styled.img`
  width: 1.5rem;
  height: auto;
`;

export default SideNavBar;
