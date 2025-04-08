import styled from "styled-components";
import { StartMembershipButton } from "./style/membership.styles";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import useUpdateUserInfo from "../../hooks/useUpdateUserInfo";

const CompletePayment = () => {
  const navigate = useNavigate();
  const { fetchUserInfo } = useUpdateUserInfo();
  // const { refetch: subscribeRefetch } = useQuery({
  //   queryKey: ["subscribe"],
  //   queryFn: () => getUserSubscription(),
  //   enabled: false,
  //   retry: false
  // });

  // const handleStartButton = async () => {
  //   try {
  //     const { data } = await subscribeRefetch();

  //     if (!data) {
  //       console.error("구독 정보를 가져올 수 없습니다.");
  //       return;
  //     }
  //     fetchUserInfo();
  //     navigate("/update_data");
  //   } catch (error) {
  //     console.error("구독 정보 업데이트 중 오류 발생:", error);
  //   }
  // };

  return (
    <PaymentCompleteContainer>
      <CheckIconWrapper>
        <img className="check" src={"/images/check_white.svg"} />
      </CheckIconWrapper>

      <MainText>Orbis 멤버십 가입을 완료했어요!</MainText>
      <ContentWrapper>
        <div>
          Orbis 서비스를 제대로 이용하기 위해 <br />
          먼저 데이터 업데이트 페이지에서 데이터를 업데이트 해주세요.
        </div>
      </ContentWrapper>

      <StartMembershipButton type="button" onClick={handleStartButton}>
        데이터 업데이트하고 시작하기
      </StartMembershipButton>
    </PaymentCompleteContainer>
  );
};

export default CompletePayment;

const PaymentCompleteContainer = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  text-align: center;
`;

const CheckIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 4rem;
  height: 4rem;
  background-color: ${(props) => props.theme.colors.primary};
  border-radius: 50%;
  .check {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const MainText = styled.span`
  font-size: 1.8rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.black};
`;

const ContentWrapper = styled.div`
  gap: 1rem;
  display: flex;
  flex-direction: column;
  color: ${(props) => props.theme.colors.gray05};
  margin: 5% 0%;
`;
