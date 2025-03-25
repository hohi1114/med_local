import { Outlet } from "react-router-dom";
import styled from "styled-components";
import SideNavBar from "../sidebar/SideNavBar";

const BaseLayout = () => {
  return (
    <div style={{ display: "flex" }}>
      <SideNavBar />
      <Container>
        <Outlet />
      </Container>
    </div>
  );
};

export default BaseLayout;

const Container = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  background-color: #fafafb;
`;
