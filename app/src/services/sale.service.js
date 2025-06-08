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

export async function createSale({ description, items = [], discount = 0, date, title, account_id }) {
  const data = await axios.post('/sales', { description, items, discount, date, title, account_id });

  return data;
}

export async function updateSale({ description, items = [], discount = 0, date, id, title, account_id }) {
  const data = await axios.put(`/sales/${id}`, { description, items, discount, date, title, account_id });

  return data;
}
