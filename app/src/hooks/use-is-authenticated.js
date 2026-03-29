import { useQuery } from 'react-query';
import { getAuthenticatedUser } from '@/services/auth.service';

export const useAuthUser = () => {
  const query = useQuery({
    queryKey: ['users'],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: getAuthenticatedUser,
    onError: () => (window.location.href = '/login'),
    staleTime: Infinity
  });

  return query;
};
