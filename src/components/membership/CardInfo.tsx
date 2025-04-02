import { Dropdown } from "antd";
import userStore from "../../store/userStore";
import styled from "styled-components";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { postDeleteCard } from "../../utils/api/apis";

interface CardInfoProps {
  handleAddCard: () => void;
}
const CardInfo = ({ handleAddCard }: CardInfoProps) => {
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

  const cardMenu = [
    {
      key: "delete",
      label: "삭제하기",
      onClick: () => {
        deleteRegisteredCard();
      }
    }
  ];

  return user?.card_last_num && user?.card_name ? (
    <RegisteredCardBox>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <span className="card_info">{user?.card_name}</span>
        <Dropdown menu={{ items: cardMenu }} trigger={["click"]}>
          <img
            src={"/images/dot_white.svg"}
            style={{ width: 15, height: 15 }}
          />
        </Dropdown>
      </div>

      <div>
        <span className="card_info">
          **** - **** - **** - {user?.card_last_num}
        </span>
      </div>
    </RegisteredCardBox>
  ) : (
    <PaymentBox onClick={handleAddCard}>
      <img src="/images/plus.svg" style={{ width: 30, height: 30 }} />
      <span>간편 결제 추가</span>
    </PaymentBox>
  );
};

export default CardInfo;

export const RegisteredCardBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 45%;
  height: 12rem;
  border-radius: 8px;
  padding: 1.5rem 2rem;
  background-color: ${(props) => props.theme.colors.blue05};

  .card_info {
    font-size: 1.4rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.white};
  }
`;

export const PaymentBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50%;
  height: 12rem;
  border: 1.5px solid ${(props) => props.theme.colors.gray04};
  border-radius: 8px;
  padding: 1rem;
  transition: border 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  img {
    width: 30px;
    height: 30px;
    margin-bottom: 0.5rem;
  }

  span {
    font-size: 1.2rem;
    color: ${(props) => props.theme.colors.black01};
  }
`;
