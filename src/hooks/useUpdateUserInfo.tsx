import { useQuery } from "@tanstack/react-query";
import {
  getMemberships,
  getUserInfo,
  getUserSubscription
} from "../utils/api/apis";
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
  const { refetch: subscribeRefetch, isLoading: subscribeLoading } = useQuery({
    queryKey: ["subscribe"],
    queryFn: () => getUserSubscription(),
    enabled: false,
    retry: false
  });

  const updateUserMembershipInfo = async () => {
    const { data: subscribeDate } = await subscribeRefetch();

    if (
      subscribeDate?.status === "active" &&
      subscribeDate?.is_free_trial &&
      !user?.free &&
      dayjs(subscribeDate?.trial_end_date).isAfter(dayjs().format("YYYY-MM-DD"))
    ) {
      setIsFreetrialUser(true);
    } else {
      setIsFreetrialUser(false);
    }
    if (
      subscribeDate.card_last_num &&
      subscribeDate.card_name &&
      subscribeDate.nice_bid
    ) {
      setHasUserCard(true);
    } else {
      setHasUserCard(false);
    }

    if (user && !user?.free) {
      if (
        (subscribeDate?.status === "inactive" ||
          subscribeDate?.status === "expired" ||
          subscribeDate?.status === "failed") &&
        subscribeDate?.is_free_trial
      ) {
        setIsInActiveUser(true);
      } else {
        setIsInActiveUser(false);
      }
    }

    setUser({
      ...user,
      ...subscribeDate
    });
  };

  const fetchUserInfo = async () => {
    const { data: userData } = await loginRefetch();
    const { data: subscribeDate } = await subscribeRefetch();

    if (
      subscribeDate?.status === "active" &&
      subscribeDate?.is_free_trial &&
      !userData?.free &&
      dayjs(subscribeDate?.trial_end_date).isAfter(dayjs().format("YYYY-MM-DD"))
    ) {
      setIsFreetrialUser(true);
    } else {
      setIsFreetrialUser(false);
    }

    if (
      subscribeDate.card_last_num &&
      subscribeDate.card_name &&
      subscribeDate.nice_bid
    ) {
      setHasUserCard(true);
    } else {
      setHasUserCard(false);
    }

    if (userData && !userData?.free) {
      if (
        (subscribeDate?.status === "inactive" ||
          subscribeDate?.status === "expired" ||
          subscribeDate?.status === "failed") &&
        subscribeDate?.is_free_trial
      ) {
        setIsInActiveUser(true);
      } else {
        setIsInActiveUser(false);
      }
    }

    const combinedData = {
      ...userData,
      ...subscribeDate
    };
    setUser(combinedData as User);
  };

  useEffect(() => {
    if (loginLoading || subscribeLoading) {
      setFetchingUserLoading(true);
    } else {
      setFetchingUserLoading(false);
    }
  }, [loginLoading, subscribeLoading]);

  return {
    fetchUserInfo,
    updateUserMembershipInfo
  };
};

export default useUpdateUserInfo;
