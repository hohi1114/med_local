import styled from "styled-components";
import BackHeader from "../components/common/layout/BackHeader";
import ContentHeader from "../components/common/layout/ContentHeader";
import { MembershipContainer } from "./MembershipChangePage";
import { CancelButton } from "./MembershipPage";
import CardInfo from "../components/membership/CardInfo";
import { useMutation } from "@tanstack/react-query";
import { postDeleteCard } from "../utils/api/apis";
import userStore from "../store/userStore";
import { AxiosError } from "axios";

function CardManagementPage() {
  const { user, setUser } = userStore();
  const { mutate: deleteRegisteredCard } = useMutation({
    mutationFn: async () => await postDeleteCard(),
    onSuccess: () => {
      setUser({
        ...user,
        card_last_num: null,
        card_name: null
      });
    },
    onError: (err: AxiosError) => {
      alert(
        (err.response?.data as { error?: string })?.error ||
          "카드 삭제에 실패했습니다."
      );
    }
  });

  return (
    <>
      <ContentHeader title={"결제 수단 관리"} />
      <BackHeader />
      <MembershipContainer>
        <TitleWrapper>
          <span className="title">결제 수단 관리</span>
          <SubInfoText>
            멤버십 요금을 어떻게 결제할지 직접 관리하세요.
          </SubInfoText>
        </TitleWrapper>

        <div
          style={{
            minWidth: "40rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <CardInfo handleAddCard={() => console.log("hi")} />
        </div>
        <div style={{ minWidth: "20rem" }}>
          {user?.status === "active" ? (
            <CancelButton type="button" onClick={deleteRegisteredCard}>
              갱신하기
            </CancelButton>
          ) : (
            <CancelButton type="button" onClick={deleteRegisteredCard}>
              삭제하기
            </CancelButton>
          )}
        </div>
        <SubInfoText>
          * 카드 삭제를 원하는 경우 멤버십 구독을 먼저 취소해주세요.
        </SubInfoText>
      </MembershipContainer>
    </>
  );
}
export default CardManagementPage;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8rem;

  .title {
    font-size: 2rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.black};
  }
`;

const SubInfoText = styled.span`
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.gray06};
`;
