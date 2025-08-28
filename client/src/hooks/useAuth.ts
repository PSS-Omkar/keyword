import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, isFetching } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Only retry on network errors, not 401 Unauthorized
      if (error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  // Consider loading if either initial loading or fetching
  const isActuallyLoading = isLoading || (isFetching && user === undefined);
  
  // Only consider authenticated if we have user data and no 401 error
  const isAuthenticated = !!user && !error?.message?.includes('401');

  return {
    user,
    isLoading: isActuallyLoading,
    isAuthenticated,
    error,
  };
}
