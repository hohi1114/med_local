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
      ...subscribeDate,
      plan: subscribeDate.next_plan || subscribeDate.plan
    });
  };

  const fetchUserInfo = async () => {
    const { data: userData } = await loginRefetch();
    const { data: subscribeDate } = await subscribeRefetch();

    const combinedData = {
      ...userData,
      ...subscribeDate,
      plan: subscribeDate.next_plan || subscribeDate.plan
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
