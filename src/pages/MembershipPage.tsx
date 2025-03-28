import { Divider } from "antd";
import ContentHeader from "../components/common/layout/ContentHeader";
import {
  CardTitle,
  CardWrapper,
  CenterWrapper,
  ContentWrapper
} from "./SettingPage";

function MembershipPage() {
  return (
    <>
      <ContentHeader title={"멤버십 관리"} />
      <CenterWrapper>
        <ContentWrapper>
          <CardWrapper>
            <CardTitle>맴버십 변경</CardTitle>
            <Divider />
          </CardWrapper>
          <CardWrapper>
            <CardTitle>결제 정보</CardTitle>
            <Divider />
            <div
              style={{ display: "flex", gap: "1rem", flexDirection: "column" }}
            >
              <span>결제 수단 관리</span>
              <span>결제 내역 확인</span>
            </div>
          </CardWrapper>
        </ContentWrapper>
      </CenterWrapper>
    </>
  );
}

export default MembershipPage;
