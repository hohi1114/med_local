import { Menu, MenuProps } from "antd";
import { MENUITEMS } from "./sidebarData";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const SideNavBar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onClick: MenuProps["onClick"] = (e) => {
    navigate(`/${e.key}`);
  };

  return (
    <SidbarContainer collapsed={collapsed}>
      {!collapsed && (
        <LogoContainer>
          <IconStyle src="/images/defaultProfile.svg" alt="default_profile" />
          <span>Logo</span>
        </LogoContainer>
      )}

      <Menu
        onClick={onClick}
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        mode="inline"
        items={MENUITEMS}
        inlineCollapsed={collapsed}
        style={{ flex: 1, overflowY: "auto" }}
      />

      {/* <SettingContainer>
        <IconStyle src="/images/settings.svg" alt="settings" />
        설정
      </SettingContainer> */}
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
  position: fixed;
  bottom: 2.8rem;
  left: 1.5rem;
  width: 100%;
  display: flex;
  gap: 0.8rem;
  align-items: center;
  font-size: 1.3rem;
  cursor: pointer;
`;

const SidbarContainer = styled.div<{ collapsed: boolean }>`
  width: ${(props) => (props.collapsed ? "8rem" : "23rem")};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  background-color: #ffffff;
  transition: width 0.3s ease;
`;

const IconStyle = styled.img`
  width: 1.5rem;
  height: auto;
`;

export default SideNavBar;
