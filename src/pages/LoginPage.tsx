import styled from "styled-components";
import BaseButton from "../components/common/button/BaseButton";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { postLogin, postRefreshToken } from "../utils/api/apis";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { ErrorResponse, useNavigate } from "react-router-dom";

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loginMutation = useMutation({
    mutationFn: (userData: LoginParams) => postLogin(userData),
    onSuccess: () => {
      setIsLoading(false);
      navigate("/dashboard");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      setIsLoading(false);
      const errorMessage = (error.response?.data as { error?: string })?.error;
      setError(errorMessage || null);
    }
  });

  const onSubmit = (data: LoginParams) => {
    setIsLoading(true);
    loginMutation.mutate(data);
  };

  return (
    <LoginContainer>
      <LoginWrapper onSubmit={handleSubmit(onSubmit)}>
        <img
          src="/images/defaultProfile.svg"
          alt="default_profile"
          style={{ width: "5rem", height: "auto" }}
        />
        <TitleStyle>Login</TitleStyle>

        <BaseInput
          id="email"
          type="email"
          placeholder="ID"
          {...register("email", { required: "ID is required" })}
        />
        <BaseInput
          type="password"
          placeholder="Password"
          {...register("password", { required: "Password is required" })}
        />

        <div style={{ minWidth: "20rem" }}>
          <StyledButton type="submit" isLoading={isLoading}>
            Sign in
          </StyledButton>
        </div>
        {/**Error Messages */}
        <div style={{ color: "#E53E3E", textAlign: "left" }}>
          <div>{errors.email?.message}</div>
          <div>{errors.password?.message}</div>
          <div>{error}</div>
        </div>
      </LoginWrapper>
    </LoginContainer>
  );
};

export default LoginPage;

const BaseInput = styled.input`
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 13px 10px;
  border-radius: 6px;
  min-width: 20rem;
  font-size: 1.2rem;
  transition: 0.2s ease-in-out;
  box-sizing: border-box;

  &:focus {
    border-color: #6a5acd;
    outline: none;
    box-shadow: 0 0 5px rgba(106, 90, 205, 0.3);
  }
`;

const StyledButton = styled(BaseButton)`
  width: 100%;
  color: white;
  transition: 0.2s ease-in-out;
  &:hover {
    background: #5a4ec5;
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
  gap: 1.75rem;
  background-color: #ffffff;
  max-width: 43rem;
  width: 70%;
  max-height: 30rem;
  height: 100%;
  padding: 4rem;
  border-radius: 1rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
`;

const TitleStyle = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;
