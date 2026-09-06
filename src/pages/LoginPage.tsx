import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { postActiveLicense, postLogin } from "../utils/api/apis";
import { setAutoLogin } from "../utils/api/token";
import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import { ErrorResponse, useNavigate } from "react-router-dom";

import LicenseModal from "../components/common/modal/LicenseModal";
import { postActiveLicenseParams } from "../types/params";
import useFingerPrintNumber from "../hooks/useFingerPrintNumber";
import BaseInput from "../components/common/input/BaseInput";
import useUpdateUserInfo from "../hooks/useUpdateUserInfo";

export type LoginParams = {
  email: string;
  password: string;
  hardwareFingerprint: string;
};
const LoginPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginParams>();
  const { getFingerPrint, setFingurePrintNumber, saveFingerPrint } =
    useFingerPrintNumber();
  const { fetchUserInfo } = useUpdateUserInfo();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [licenseCode, setLicenseCode] = useState<string | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);
  const [hardwareFingerprint, setHardwareFingerprint] = useState<string>("");
  const [autoLoginChecked, setAutoLoginChecked] = useState<boolean>(true);

  useEffect(() => {
    const getHardwareId = async () => {
      const hardware = await getFingerPrint();
      setHardwareFingerprint(hardware);
      setFingurePrintNumber(hardware);
    };
    getHardwareId();
  }, [getFingerPrint, setFingurePrintNumber]);

  //only first
  const { mutate: postActiveLicenseMutation } = useMutation({
    mutationFn: async (params: postActiveLicenseParams) =>
      await postActiveLicense(params),
    onSuccess: async () => {
      saveFingerPrint();
      fetchUserInfo();
      navigate("/dashboard");
    },
    onError: (err: AxiosError) =>
      alert(
        (err.response?.data as { error?: string })?.error ||
        "License activation failed"
      )
  });

  const loginMutation = useMutation({
    mutationFn: (userData: LoginParams) => postLogin(userData),
    onSuccess: async (data) => {
      setIsLoading(false);
      const { activated, hasAvailableSlots } = data;

      if (activated) {
        // If already activated, go to dashboard
        fetchUserInfo();
        navigate("/dashboard");
      } else if (hasAvailableSlots) {
        // If there are slots, show modal to activate license
        setIsLicenseModalOpen(true);
      } else {
        setError("No available device slots for this license");
      }
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      setIsLoading(false);
      const errorMessage = (error.response?.data as { error?: string })?.error;
      setError(errorMessage || null);
    }
  });

  const handleConfirmButton = () => {
    if (licenseCode && hardwareFingerprint) {
      postActiveLicenseMutation({
        licenseCode: licenseCode,
        hardwareFingerprint: hardwareFingerprint
      });
    } else {
      alert("라이센스 코드를 입력해주세요.");
    }
  };

  const onSubmit = (data: LoginParams) => {
    setIsLoading(true);
    // 자동 로그인 선택값 저장 (토큰 쿠키 만료 방식 결정)
    setAutoLogin(autoLoginChecked);
    const isTestUser = data.email === "nicetest@naver.com";
    const customFingerprint = isTestUser ? "nice" : hardwareFingerprint;
    const loginData = {
      ...data,
      hardwareFingerprint: customFingerprint
    };
    loginMutation.mutate(loginData);
  };

  return (
    <LoginContainer>
      <LicenseModal
        isModalOpen={isLicenseModalOpen}
        handleLicenseInput={setLicenseCode}
        handleComfirmButton={handleConfirmButton}
        handleLicenseModal={() => setIsLicenseModalOpen(!isLicenseModalOpen)}
      />
      <LoginWrapper onSubmit={handleSubmit(onSubmit)}>
        <img
          src="/logo.png"
          alt="default_profile"
          style={{ width: "10rem", height: "auto" }}
        />
        <TitleStyle>로그인</TitleStyle>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <BaseInput
            type="email"
            placeholder="이메일 주소"
            {...register("email", { required: "ID를 입력해주세요" })}
          />
          <BaseInput
            type="password"
            placeholder="비밀번호"
            {...register("password", { required: "비밀번호를 입력해주세요." })}
          />
        </div>

        <AutoLoginLabel>
          <input
            type="checkbox"
            checked={autoLoginChecked}
            onChange={(e) => setAutoLoginChecked(e.target.checked)}
          />
          자동 로그인
        </AutoLoginLabel>

        <div style={{ minWidth: "20rem" }}>
          <StyledButton type="submit" isLoading={isLoading}>
            로그인 하기
          </StyledButton>
        </div>
        {/**Error Messages */}
        <ErrorMessage>
          {errors.email?.message || errors.password?.message || error}
        </ErrorMessage>
      </LoginWrapper>
    </LoginContainer>
  );
};

export default LoginPage;

const StyledButton = styled(BaseButton)`
  width: 100%;
  color: ${(props) => props.theme.colors.white};
  transition: 0.2s ease-in-out;
  &:hover {
    background: ${(props) => props.theme.colors.darkPrimary};
  }
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const LoginWrapper = styled.form`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 1.2rem;
  background-color: ${(props) => props.theme.colors.white};
  max-width: 43rem;
  width: 70%;
  max-height: 30rem;
  height: 100%;
  padding: 4rem;
  border-radius: 1rem;
  box-shadow: ${(props) => props.theme.shadows.medium};
`;

const TitleStyle = styled.div`
  font-size: 1.5rem;
  font-weight: bold
`;
const ErrorMessage = styled.div`
  color: ${(props) => props.theme.colors.red};
  text-align: center;
`;

const AutoLoginLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.gray06};
  cursor: pointer;
  input {
    width: 1.1rem;
    height: 1.1rem;
    cursor: pointer;
  }
`;
