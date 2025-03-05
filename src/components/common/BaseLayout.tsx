import { Outlet } from "react-router-dom";
import styled from "styled-components";
import SideBar from "./sidebar/SideBar";

const BaseLayout = () => {
    return (
        <Container>
            <SideBar /> {/* ✅ Sidebar will be on the left */}
            <Content> {/* ✅ Main content will be on the right */}
                <Outlet />
            </Content>
        </Container>
    );
};

export default BaseLayout;

const Container = styled.div`
  display: flex;  /* ✅ Sidebar & Content side by side */
  height: 100vh;  /* Full viewport height */
`;
const Content = styled.div`
  flex: 1;  /* ✅ Takes remaining space */
  padding: 20px;
  overflow-y: auto;  /* Scrollable if needed */
`;

