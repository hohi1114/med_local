import { Menu, MenuProps } from "antd";
import { MenuItem, MENUITEMS } from "./sidebarData";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import userStore from "../../../store/userStore";

const SideNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = userStore();

  const [collapsed, setCollapsed] = useState<boolean>(window.innerWidth <= 768);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    location.pathname.replace("/", "")
  ]);

  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth <= 768);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSelectedKeys([location.pathname.replace("/", "")]);
  }, [location.pathname]);

  // 메뉴 필터링 (useMemo로 성능 최적화)
  const filteredMenuItems = useMemo<MenuItem[]>(() => {
    if (!user.free) return MENUITEMS;

    return MENUITEMS.map((menu) => {
      if (menu.key === "setting" && menu.children) {
        return { ...menu, children: [{ key: "account", label: "계정" }] };
      }
      return menu;
    });
  }, [user.free]);

  return (
    <SidebarContainer collapsed={collapsed}>
      <LogoContainer collapsed={collapsed}>
        <MenuIcon
          src="/images/menu.svg"
          onClick={() => setCollapsed((prev) => !prev)}
          alt="menu icon"
        />
        {!collapsed && <LogoText>ORBIS</LogoText>}
      </LogoContainer>

      <Menu
        onClick={(e) => navigate(`/${e.key}`)}
        selectedKeys={selectedKeys}
        mode="inline"
        items={filteredMenuItems}
        inlineCollapsed={collapsed}
        style={{ flex: 1, overflowY: "auto" }}
      />
    </SidebarContainer>
  );
};

const SidebarContainer = styled.div<{ collapsed: boolean }>`
  width: ${({ collapsed }) => (collapsed ? "7rem" : "20rem")};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  background-color: ${(props) => props.theme.colors.white};
  transition: width 0.3s ease;
`;

const LogoContainer = styled.div<{ collapsed: boolean }>`
  padding: ${({ collapsed }) => (collapsed ? "1rem 2.3rem" : "1rem 2rem")};
  display: flex;
  align-items: center;
  gap: 6px;
  border-right: 1px solid ${(props) => props.theme.colors.gray01};
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
