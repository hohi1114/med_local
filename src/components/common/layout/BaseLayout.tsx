import { Outlet } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../sidebar/SideBar";

const BaseLayout = () => {
  return (
    <Container>
      <SideBar />
      <Outlet />
    </Container>
  );
};

export default BaseLayout;

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #fafafb;
`;
