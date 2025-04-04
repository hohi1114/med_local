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

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    gap: 1.5rem;
  }
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
    color: ${(props) => props.theme.colors.black};
  }

  .modal-subtitle {
    display: flex;
    flex-direction: column;
    color: ${(props) => props.theme.colors.gray05};
    font-size: 1.2rem;
  }
`;

export const MemberShipWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 33rem;

  @media (max-width: 768px) {
    min-width: auto;
  }

  .disclaimer {
    color: ${(props) => props.theme.colors.gray05};
    font-size: 1.2rem;
  }
`;

export const MembershipCard = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-radius: 8px;
  border: ${(props) => (props.selected ? "2px" : "1px")} solid
    ${(props) =>
      props.selected ? props.theme.colors.primary : props.theme.colors.gray03};
  transition: border 0.1s ease, box-shadow 0.1s ease;

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

    @media (max-width: 480px) {
      font-size: 1.2rem;
    }
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

    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }

  .discounted-price {
    font-size: 1.4rem;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};

    @media (max-width: 480px) {
      font-size: 1.2rem;
    }
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

export const StartMembershipButton = styled(BaseButton)`
  height: 4rem;
  font-size: 1.3rem;

  &:hover {
    background-color: ${(props) => props.theme.colors.darkPrimary};
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
    height: 3.5rem;
  }
`;
