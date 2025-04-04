import styled from "styled-components";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import BackHeader from "../components/common/layout/BackHeader";
import ContentHeader from "../components/common/layout/ContentHeader";
import CardInfo from "../components/membership/CardInfo";
import RegisterCard from "../components/membership/RegisterCard";
import { MembershipContainer } from "./MembershipChangePage";
import { CancelButton } from "./MembershipPage";

import { postDeleteCard } from "../utils/api/apis";
import userStore from "../store/userStore";
import Loading from "../components/common/Loading";
import { useState } from "react";
import useUpdateUserInfo from "../hooks/useUpdateUserInfo";

function CardManagementPage() {
  const { user } = userStore();
  const [updateCard, setUpdateCard] = useState(false);
  const { updateUserMembershipInfo } = useUpdateUserInfo();

  const { mutate: deleteRegisteredCard, isPending } = useMutation({
    mutationFn: postDeleteCard,
    onSuccess: () => {
      updateUserMembershipInfo();
    },
    onError: (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as { error?: string })?.error ||
        "카드 삭제에 실패했습니다.";
      alert(errorMessage);
    }
  });

  const handleAddCard = () => setUpdateCard(true);
  const handleCompleteUpdate = () => setUpdateCard(false);

  const isCardRegistered = user?.card_last_num && user.card_name;
  const isActiveSubscription = user?.status === "active";

  return (
    <>
      <ContentHeader title="결제 수단 관리" />
      <BackHeader />
      {isPending && <Loading />}
      <MembershipContainer>
        {updateCard ? (
          <RegisterCard
            withoutHeader={false}
            handleCompleteUpdate={handleCompleteUpdate}
          />
        ) : (
          <>
            <TitleWrapper>
              <Title>결제 수단 관리</Title>
              <SubInfoText>
                멤버십 요금을 어떻게 결제할지 직접 관리하세요.
              </SubInfoText>
            </TitleWrapper>

            <CardInfoWrapper>
              <CardInfo handleAddCard={handleAddCard} hideCancel />
            </CardInfoWrapper>

            <ButtonContainer>
              {isActiveSubscription ? (
                <>
                  <CancelButton type="button" onClick={handleAddCard}>
                    갱신하기
                  </CancelButton>
                  <SubInfoText>
                    * 카드 삭제를 원하는 경우 멤버십 구독을 먼저 취소해주세요.
                  </SubInfoText>
                </>
              ) : (
                isCardRegistered && (
                  <CancelButton type="button" onClick={deleteRegisteredCard}>
                    삭제하기
                  </CancelButton>
                )
              )}
            </ButtonContainer>
          </>
        )}
      </MembershipContainer>
    </>
  );
}

export default CardManagementPage;

// Styled Components
const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8rem;
`;

const Title = styled.span`
  font-size: 2rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.black};
`;

const SubInfoText = styled.span`
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.gray06};
`;

const CardInfoWrapper = styled.div`
  min-width: 40rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ButtonContainer = styled.div`
  min-width: 20rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;
