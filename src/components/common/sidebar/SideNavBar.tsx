import { Menu, MenuProps } from "antd";
import { MENUITEMS } from "./sidebarData";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const SideNavBar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    location.pathname
  ]);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onClick: MenuProps["onClick"] = (e) => {
    navigate(`/${e.key}`);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    setSelectedKeys([location.pathname.replace("/", "")]);
  }, [location.pathname]);

  return (
    <SidebarContainer collapsed={collapsed}>
      <LogoContainer collapsed={collapsed}>
        <MenuIcon
          src="/images/menu.svg"
          onClick={toggleCollapsed}
          alt="menu icon"
        />
        {!collapsed && <LogoText>ORBIS</LogoText>}
      </LogoContainer>

      <Menu
        onClick={onClick}
        selectedKeys={selectedKeys}
        mode="inline"
        items={MENUITEMS}
        inlineCollapsed={collapsed}
        style={{ flex: 1, overflowY: "auto" }}
      />
    </SidebarContainer>
  );
};

// Styled components

const SidebarContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !["collapsed"].includes(prop)
})<{ collapsed: boolean }>`
  width: ${(props) => (props.collapsed ? "7rem" : "20rem")};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  background-color: #ffffff;
  transition: width 0.3s ease;
`;

const LogoContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !["collapsed"].includes(prop)
})<{ collapsed: boolean }>`
  padding: ${(props) => (props.collapsed ? "1rem 2.3rem" : "1rem 2rem")};
  display: flex;
  align-items: center;
  gap: 6px;
  border-right: 1px solid #f3f2f3;
`;

const MenuIcon = styled.img`
  width: 2rem;
  height: auto;
  cursor: pointer;
`;

const LogoText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.1rem;
  font-size: 1.5rem;
  font-weight: bold;
`;

export default SideNavBar;
