import styled from "styled-components";
import BaseButton from "../../common/button/BaseButton";

export const FreeTrialModalContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: 2rem;
  background-color: ${(props) => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
`;

export const TitleWrapper = styled.div<{ isAbsolute?: boolean }>`
  ${({ isAbsolute }) =>
    isAbsolute &&
    `
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  `}
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .modal-title {
    font-weight: bold;
    font-size: 1.8rem;
    color: ${(props) => props.theme.colors.primary};
  }

  .modal-subtitle {
    display: flex;
    flex-direction: column;
    color: ${(props) => props.theme.colors.gray05};
  }
`;

export const MemberShipWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  .disclaimer {
    color: ${(props) => props.theme.colors.gray05};
  }
`;

export const MembershipCard = styled.div<{ selected?: boolean }>`
  display: flex;
  padding: 1.5rem;
  border-radius: 8px;
  border: ${(props) => (props.selected ? "2px" : "1px")} solid
    ${(props) =>
      props.selected ? props.theme.colors.primary : props.theme.colors.gray03};
  justify-content: space-between;
  align-items: center;
  transition: border 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .plan-info {
    display: flex;
    flex-direction: column;
  }

  .plan-name {
    font-size: 1.4rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.black};
  }

  .plan-pricing {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .original-price {
    font-size: 1.2rem;
    text-decoration: line-through;
    color: ${(props) => props.theme.colors.gray05};
  }

  .discounted-price {
    font-size: 1.4rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
  }
`;

export const StartMembershipButton = styled(BaseButton)`
  height: 4rem;
  font-size: 1.3rem;
  font-weight: bold;
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.white};
  border-radius: 8px;
  padding: 0.8rem 2rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => props.theme.colors.darkPrimary};
  }
`;

/**Free tial Form */

export const BackHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

export const SelectedMemberShipCard = styled.div`
  display: flex;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.colors.gray03};
  justify-content: space-between;

  .plan-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.6rem;
  }

  .plan-name {
    font-size: 1.6rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.black};
  }

  .plan-pricing {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    text-align: right;
  }

  .monthly-price {
    font-size: 1.4rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.black01};
  }

  .price-label {
    font-size: 1.3rem;
    color: ${(props) => props.theme.colors.gray06};
  }

  .result-price {
    font-size: 1.7rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
  }
`;
