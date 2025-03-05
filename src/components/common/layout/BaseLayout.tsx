import { Outlet } from "react-router-dom";
import styled from "styled-components";
import SideNavBar from "../sidebar/SideNavBar";

const BaseLayout = () => {
  return (
    <Container>
      <SideNavBar />
      <Outlet />
    </Container>
  );
};

export default BaseLayout;

const Container = styled.div`
  display: flex;
  width: 100%;
  background-color: #fafafb;
`;
