import styled from "styled-components";
import { BackHeaderWrapper } from "./PaymentForm";
import {
  MemberShipWrapper,
  StartMembershipButton,
  TitleWrapper
} from "./style/membership.styles";
import { useForm } from "react-hook-form";
import AgreementBox from "./AgreementBox";
import { useState } from "react";
import usePaymentStore from "../../store/usePaymenyStore";

type RegisterCardFormValues = {
  cardNo: string[];
  expireDate: string;
  password: string;
};

const RegisterCard = () => {
  const { prevStep, nextStep, setCardInfo } = usePaymentStore();
  const {
    handleSubmit,
    register,
    formState: { errors, isValid }
  } = useForm<RegisterCardFormValues>({
    defaultValues: { cardNo: ["", "", "", ""], expireDate: "", password: "" }
  });

  const [isCheckedAgreement, setIsCheckedAgreement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (data: RegisterCardFormValues) => {
    if (!isCheckedAgreement) return;

    // const fullCardNumber = data.cardNo.join("");
    // setCardInfo(fullCardNumber);
    // nextStep();
  };

  return (
    <>
      <BackHeaderWrapper>
        <img
          src="/images/arrow.svg"
          style={{ width: 30, height: 30, cursor: "pointer" }}
          onClick={prevStep}
        />
        <TitleWrapper isAbsolute>
          <span className="modal-title" style={{ textAlign: "center" }}>
            카드 등록
          </span>
        </TitleWrapper>
      </BackHeaderWrapper>

      <form onSubmit={handleSubmit(onSubmit)}>
        <MemberShipWrapper>
          <CardInfoWrapper>
            <CardTitle>카드 정보 입력</CardTitle>

            <InputWrapper>
              <span>카드 번호</span>
              <CardNumberWrapper>
                {[0, 1, 2, 3].map((index) => (
                  <CardInfoInput
                    key={index}
                    inputMode="numeric"
                    type="tel"
                    placeholder="0000"
                    maxLength={4}
                    required
                    {...register(`cardNo.${index}`, {
                      required: "카드 번호 16자리를 올바르게 입력해주세요.",
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }
                    })}
                  />
                ))}
              </CardNumberWrapper>
              <ErrorText>
                {errors.cardNo?.[0]?.message ||
                  errors.cardNo?.[1]?.message ||
                  errors.cardNo?.[2]?.message ||
                  errors.cardNo?.[3]?.message}
              </ErrorText>
            </InputWrapper>

            <InputWrapper>
              <span>유효기간</span>
              <CardNumberWrapper>
                <CardInfoInput
                  type="text"
                  placeholder="MM/YY"
                  className="wide-input"
                  maxLength={5}
                  required
                  {...register("expireDate", {
                    required: "MMYY 형식으로 입력해주세요.",
                    onChange: (e) => {
                      let value = e.target.value.replace(/[^0-9]/g, "");
                      if (value.length > 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2);
                      }
                      e.target.value = value;
                    }
                  })}
                />
              </CardNumberWrapper>
              <ErrorText>{errors.expireDate?.message}</ErrorText>
            </InputWrapper>

            <InputWrapper>
              <span>카드 비밀번호</span>
              <CardNumberWrapper>
                <CardInfoInput
                  inputMode="numeric"
                  type="tel"
                  className="wide-input"
                  placeholder="비밀번호 앞 2자리"
                  maxLength={2}
                  required
                  {...register("password", {
                    required: "카드 결제 비밀번호 앞 2자리를 입력해주세요.",
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    }
                  })}
                />
              </CardNumberWrapper>
              <ErrorText>{errors.password?.message}</ErrorText>
              <ErrorText>{error}</ErrorText>
            </InputWrapper>
          </CardInfoWrapper>

          <AgreementBox
            isChecked={isCheckedAgreement}
            setIsChecked={setIsCheckedAgreement}
            content="결제사 정보 제공에 동의합니다."
            moreInfoLink={false}
          />

          <StartMembershipButton
            type="submit"
            disabled={!isCheckedAgreement || !isValid}
          >
            등록하기
          </StartMembershipButton>
        </MemberShipWrapper>
      </form>
    </>
  );
};

export default RegisterCard;

const CardInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CardTitle = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const CardNumberWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const CardInfoInput = styled.input`
  flex-grow: 1;
  max-width: 6rem;
  height: 2.5rem;
  border: none;
  text-align: center;
  font-size: 1.3rem;
  border-bottom: 2px solid ${(props) => props.theme.colors.gray04};

  &:focus {
    outline: none;
    border-bottom: 2px solid ${(props) => props.theme.colors.primary};
  }
  &.wide-input {
    max-width: 12rem;
  }
`;

const ErrorText = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.red};
`;
