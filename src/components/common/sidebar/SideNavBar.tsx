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
          <IconStyle src="/images/logo.png" alt="default_profile" />
          <span style={{ fontSize: "1.2rem" }}>Orbis</span>
        </LogoContainer>
      )}

      <Menu
        onClick={onClick}
        defaultSelectedKeys={["Dashboard"]}
        mode="inline"
        items={MENUITEMS}
        inlineCollapsed={collapsed}
        style={{ flex: 1, overflowY: "auto" }}
      />
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
  width: 2.5rem;
  height: auto;
  /* border-radius: 100%; */
`;

export default SideNavBar;
