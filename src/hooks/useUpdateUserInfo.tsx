import { useQuery, useQueryClient } from "@tanstack/react-query";
import userStore, { User } from "../store/userStore";
import { getUserInfo, getUserSubscription } from "../utils/api/apis";
import { useEffect } from "react";

const useUpdateUserInfo = () => {
  const { user, setUser, setFetchingUserLoading } = userStore();

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

    setUser({
      ...user,
      nextBillingDate: subscribeDate.next_billing_date,
      isFreeTrial: subscribeDate.is_free_trial,
      trialEndDate: subscribeDate.trial_end_date,
      cardName: subscribeDate.card_name,
      cardLastNumber: subscribeDate.card_last_num,
      status: subscribeDate.status
    });
  };

  const fetchUserInfo = async () => {
    const { data: userData } = await loginRefetch();
    const { data: subscribeDate } = await subscribeRefetch();

    const combinedData = {
      ...userData,
      subscribedStatus: subscribeDate.status,
      plan: subscribeDate.plan,
      nextBillingDate: subscribeDate.next_billing_date,
      isFreeTrial: subscribeDate.is_free_trial,
      trialEndDate: subscribeDate.trial_end_date,
      cardName: subscribeDate.card_name,
      cardLastNumber: subscribeDate.card_last_num,
      status: subscribeDate.status
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
