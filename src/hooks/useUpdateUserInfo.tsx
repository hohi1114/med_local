import { useQuery } from "@tanstack/react-query";
import { getMemberships, getUserInfo } from "../utils/api/apis";
import { useEffect } from "react";
import usePaymentStore from "../store/usePaymenyStore";
import dayjs from "dayjs";
import userStore from "../store/userStore";
import { User } from "../types/auth";

const useUpdateUserInfo = () => {
  const {
    user,
    setUser,
    setFetchingUserLoading,
    setIsFreetrialUser,
    setIsInActiveUser,
    setHasUserCard
  } = userStore();
  const { memberships, setMemberships } = usePaymentStore();
  const { refetch: membershipFetch, data: membershipsRes } = useQuery({
    queryKey: ["memberships"],
    queryFn: () => getMemberships(),
    enabled: true,
    retry: false
  });
  //그냥 앱 기본 데이터
  useEffect(() => {
    if (memberships.length === 0) {
      membershipFetch();
    }
  }, []);

  useEffect(() => {
    if (membershipsRes) {
      const { memberships } = membershipsRes;
      setMemberships(memberships);
    }
  }, [membershipsRes]);

  //**APIs
  const { refetch: loginRefetch, isLoading: loginLoading } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: false,
    retry: false
  });

  const fetchUserInfo = async () => {
    const { data: userData } = await loginRefetch();
    const { user, subscription } = userData;

    if (
      subscription?.status === "active" &&
      subscription?.is_free_trial &&
      !user?.free &&
      dayjs(subscription?.trial_end_date).isAfter(dayjs().format("YYYY-MM-DD"))
    ) {
      setIsFreetrialUser(true);
    } else {
      setIsFreetrialUser(false);
    }

    if (
      subscription.card_last_num &&
      subscription.card_name &&
      subscription.nice_bid
    ) {
      setHasUserCard(true);
    } else {
      setHasUserCard(false);
    }

    if (user && !user?.free) {
      if (
        (subscription?.status === "inactive" ||
          subscription?.status === "expired" ||
          subscription?.status === "failed") &&
        subscription?.is_free_trial
      ) {
        setIsInActiveUser(true);
      } else {
        setIsInActiveUser(false);
      }
    }

    const combinedData = {
      ...user,
      ...subscription
    };
    setUser(combinedData as User);
  };

  useEffect(() => {
    if (loginLoading) {
      setFetchingUserLoading(true);
    } else {
      setFetchingUserLoading(false);
    }
  }, [loginLoading]);

  return {
    fetchUserInfo
  };
};

export default useUpdateUserInfo;
