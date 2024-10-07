'use client';

import { QueryClient, QueryClientProvider } from 'react-query';

const ReactQueryClientProvider = ({ children }) => {
  const queryClient = new QueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default ReactQueryClientProvider;
