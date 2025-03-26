import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getUserInfo,
  postActiveLicense,
  postLogin,
  postVerifyCode
} from "../utils/api/apis";
import { useState } from "react";
import { AxiosError } from "axios";
import { ErrorResponse, useNavigate } from "react-router-dom";
import userStore, { User } from "../store/userStore";
import LicenseModal from "../components/common/modal/LicenseModal";
import { postActiveLicenseParams } from "../types/params";
import useFingerPrintNumber from "../hooks/useFingerPrintNumber";
import BaseInput from "../components/common/input/BaseInput";

export type LoginParams = {
  email: string;
  password: string;
};
const LoginPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginParams>();
  const {
    getSavedFingerPrintNumber,
    getFingerPrint,
    setFingurePrintNumber,
    saveFingerPrint
  } = useFingerPrintNumber();
  const { setUser } = userStore();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [licenseCode, setLicenseCode] = useState<string | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);

  //**APIs
  const { refetch: loginRefetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: false,
    retry: false
  });
  //Check License (check every time)
  const { mutate: postActiveLicenseMutation } = useMutation({
    mutationFn: async (params: postActiveLicenseParams) =>
      await postActiveLicense(params),
    onSuccess: async () => {
      saveFingerPrint();
      const { data } = await loginRefetch();
      setUser(data as User);
      navigate("/dashboard");
    },
    onError: (err: AxiosError) =>
      alert(
        (err.response?.data as { error?: string })?.error ||
          "License activation failed"
      )
  });
  //Check VerifyCode (for first user)
  const { mutate: postVerifyMutation } = useMutation({
    mutationFn: async (hardwareNumber: string) =>
      await postVerifyCode(hardwareNumber),
    onSuccess: async () => {
      const { data } = await loginRefetch();
      setUser(data as User);
      navigate("/dashboard");
    }
  });
  //Login
  const loginMutation = useMutation({
    mutationFn: (userData: LoginParams) => postLogin(userData),
    onSuccess: async (data) => {
      // const { data } = await loginRefetch();
      // setUser(data as User);
      // navigate("/dashboard");
      const { activated } = data;
      setIsLoading(false);
      const { hardware } = await window.electron.getSystemUUID();
      activated ? postVerifyMutation(hardware) : setIsLicenseModalOpen(true);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      setIsLoading(false);
      const errorMessage = (error.response?.data as { error?: string })?.error;
      setError(errorMessage || null);
    }
  });

  const handleConfirmButton = () => {
    const verifyLicense = async () => {
      const hardwareNumber = await getFingerPrint();

      setFingurePrintNumber(hardwareNumber);
      if (licenseCode && hardwareNumber) {
        postActiveLicenseMutation({
          licenseCode: licenseCode,
          hardwareFingerprint: hardwareNumber
        });
      } else {
        alert("라이센스 코드를 입력해주세요.");
      }
    };
    verifyLicense();
  };

  const onSubmit = (data: LoginParams) => {
    setIsLoading(true);
    loginMutation.mutate(data);
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
          style={{ width: "5rem", height: "auto" }}
        />
        <TitleStyle>Login</TitleStyle>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <BaseInput
            type="email"
            placeholder="Email"
            {...register("email", { required: "ID를 입력해주세요." })}
          />
          <BaseInput
            type="password"
            placeholder="Password"
            {...register("password", { required: "비밀번호를 입력해주세요." })}
          />
        </div>

        <div style={{ minWidth: "20rem" }}>
          <StyledButton type="submit" isLoading={isLoading}>
            Sign in
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
  font-weight: bold;
`;
const ErrorMessage = styled.div`
  color: ${(props) => props.theme.colors.red};
  text-align: center;
`;
