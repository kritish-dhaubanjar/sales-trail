import axios from '@/lib/axios';

export async function getSales({ page, limit, query }) {
  const data = await axios.get('/sales', { params: { page, limit, q: query } });

  return data;
}

export async function getSale({ id }) {
  const data = await axios.get(`/sales/${id}`);

  return data;
}

export async function deleteSale({ id }) {
  const data = await axios.delete(`/sales/${id}`);

  return data;
}

export async function createSale({ name }) {
  const data = await axios.post('/sales', { name });

  return data;
}

export async function updateSale({ name, id }) {
  const data = await axios.put(`/sales/${id}`, { name });

  return data;
}