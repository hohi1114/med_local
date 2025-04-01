import { useQuery, useQueryClient } from "@tanstack/react-query";
import userStore, { User } from "../store/userStore";
import { getUserInfo, getUserSubscription } from "../utils/api/apis";

const useUpdateUserInfo = () => {
  const { user, setUser } = userStore();

  //**APIs
  const { refetch: loginRefetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: false,
    retry: false
  });
  const { refetch: subscribeRefetch } = useQuery({
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

  return { fetchUserInfo, updateUserMembershipInfo };
};

export default useUpdateUserInfo;
