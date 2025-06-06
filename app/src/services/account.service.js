import axios from '@/lib/axios';

export async function getAccounts({ page, limit, query }) {
  const data = await axios.get('/accounts', { params: { page, limit, q: query } });

  return data;
}

export async function deleteAccount({ id }) {
  const data = await axios.delete(`/accounts/${id}`);

  return data;
}

export async function createAccount({ name }) {
  const data = await axios.post('/accounts', { name });

  return data;
}

export async function updateAccount({ name, id }) {
  const data = await axios.put(`/accounts/${id}`, { name });

  return data;
}
