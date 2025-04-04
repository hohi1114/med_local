import styled from "styled-components";
import { BackHeaderWrapper } from "./PaymentForm";
import {
  MemberShipWrapper,
  StartMembershipButton,
  TitleWrapper
} from "./style/membership.styles";
import { useForm } from "react-hook-form";
import AgreementBox from "./AgreementBox";
import { useEffect, useState } from "react";
import usePaymentStore from "../../store/usePaymenyStore";
import { useMutation } from "@tanstack/react-query";
import { RegisterCardParams } from "../../types/params";
import { postRegisterCard } from "../../utils/api/apis";
import { Radio } from "antd";
import { AxiosError } from "axios";
import useUpdateUserInfo from "../../hooks/useUpdateUserInfo";

type RegisterCardFormValues = {
  cardNo: string[];
  expireDate: string;
  password: string;
  idNum: string;
};

interface RegisterCardProps {
  withoutHeader?: boolean;
  handleCompleteUpdate: () => void;
}

const RegisterCard: React.FC<RegisterCardProps> = ({
  withoutHeader = true,
  handleCompleteUpdate
}) => {
  const { prevStep } = usePaymentStore();
  const { updateUserMembershipInfo } = useUpdateUserInfo();
  const {
    handleSubmit,
    register,
    reset,
    getValues,
    formState: { errors, isValid }
  } = useForm<RegisterCardFormValues>({
    defaultValues: { cardNo: ["", "", "", ""], expireDate: "", password: "" }
  });

  const { mutate: regitserCardMutation, isPending } = useMutation({
    mutationFn: async (params: RegisterCardParams) =>
      await postRegisterCard(params),
    onSuccess: (data) => {
      updateUserMembershipInfo();
      handleCompleteUpdate();
    },
    onError: (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as { error?: string })?.error ||
        "카드 등록에 실패했습니다.";
      setError(errorMessage);
    }
  });

  const [isCheckedAgreement, setIsCheckedAgreement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idType, setIdType] = useState<"birth" | "business">("birth");

  const onSubmit = (data: RegisterCardFormValues) => {
    const params = {
      cardNo: data.cardNo.join(""),
      expMonth: data.expireDate.slice(0, 2),
      expYear: data.expireDate.slice(3, 5),
      cardPw: data.password,
      idNo: data.idNum
    };

    regitserCardMutation(params);
  };

  useEffect(() => {
    reset({
      ...getValues(),
      idNum: ""
    });
  }, [idType]);

  return (
    <>
      {withoutHeader && (
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
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <MemberShipWrapper>
          <CardInfoWrapper>
            <CardTitle>카드 정보 입력</CardTitle>

            <InputWrapper>
              <span>카드 번호</span>
              <CardNumberWrapper>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index}>
                    <CardInfoInput
                      inputMode="numeric"
                      type={index === 1 || index === 2 ? "password" : "tel"}
                      placeholder="0000"
                      maxLength={4}
                      required
                      {...register(`cardNo.${index}`, {
                        required: "카드 번호 16자리를 입력해주세요.",
                        minLength: {
                          value: 4,
                          message: "카드 번호 16자리를 올바르게 입력해주세요."
                        },
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                        }
                      })}
                    />
                    {index !== 3 && <span>&mdash;</span>}
                  </div>
                ))}
              </CardNumberWrapper>
              <ErrorText>
                {errors.cardNo?.[0]?.message ||
                  errors.cardNo?.[1]?.message ||
                  errors.cardNo?.[2]?.message ||
                  errors.cardNo?.[3]?.message}
              </ErrorText>
            </InputWrapper>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "end"
              }}
            >
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
                      minLength: {
                        value: 5,
                        message: "MMYY 형식으로 입력해주세요."
                      },
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
                <div style={{ display: "flex", gap: "1rem" }}>
                  <Radio.Group
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  >
                    <Radio.Button value="birth">생년월일</Radio.Button>
                    <Radio.Button value="business">사업자번호</Radio.Button>
                  </Radio.Group>
                </div>

                <CardNumberWrapper>
                  <CardInfoInput
                    type="text"
                    placeholder={
                      idType === "birth" ? "YYMMDD" : "사업자번호 10자리"
                    }
                    className="wide-input"
                    maxLength={idType === "birth" ? 6 : 10}
                    required
                    {...register("idNum", {
                      required:
                        idType === "birth"
                          ? "생년월일을 6자리를 입력해주세요."
                          : "사업자번호 10자리를 입력해주세요.",
                      minLength: {
                        value: idType === "birth" ? 6 : 10,
                        message:
                          idType === "birth"
                            ? "생년월일을 6자리를 입력해주세요."
                            : "사업자번호 10자리를 입력해주세요."
                      },
                      pattern: {
                        value:
                          idType === "birth" ? /^[0-9]{6}$/ : /^[0-9]{10}$/,
                        message: "숫자만 입력해주세요."
                      },
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }
                    })}
                  />
                </CardNumberWrapper>
                <ErrorText>{errors.idNum?.message}</ErrorText>
              </InputWrapper>
            </div>

            <InputWrapper>
              <span>카드 비밀번호</span>
              <CardNumberWrapper>
                <CardInfoInput
                  inputMode="numeric"
                  type="password"
                  className="wide-input"
                  placeholder="비밀번호 앞 2자리"
                  maxLength={2}
                  required
                  {...register("password", {
                    required: "카드 결제 비밀번호 앞 2자리를 입력해주세요.",
                    minLength: {
                      value: 2,
                      message: "카드 결제 비밀번호 앞 2자리를 입력해주세요."
                    },
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
            moreInfoLink={true}
          />

          <StartMembershipButton
            type="submit"
            disabled={!isCheckedAgreement || !isValid}
            isLoading={isPending}
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

  @media (max-width: 768px) {
    gap: 0.8rem;
  }
`;

const CardTitle = styled.span`
  font-size: 1.2rem;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @media (max-width: 768px) {
    gap: 0.6rem;
  }
`;

const CardNumberWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  flex-wrap: wrap;
  color: ${(props) => props.theme.colors.gray04};

  @media (max-width: 768px) {
    gap: 0.5rem;
    justify-content: flex-start;
  }
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
    max-width: 20rem;

    @media (max-width: 768px) {
      max-width: 100%;
    }
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
    max-width: 5rem;
    height: 2.2rem;
  }
`;

const ErrorText = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.red};

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;
