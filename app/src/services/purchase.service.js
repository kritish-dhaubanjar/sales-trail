import axios from '@/lib/axios';

export async function getPurchases({ page, limit, query }) {
  const data = await axios.get('/purchases', { params: { page, limit, q: query } });

  return data;
}

export async function getPurchase({ id }) {
  const data = await axios.get(`/purchases/${id}`);

  return data;
}

export async function deletePurchase({ id }) {
  const data = await axios.delete(`/purchases/${id}`);

  return data;
}

export async function createPurchase({ description, items = [], discount = 0, date, title, transactions }) {
  const data = await axios.post('/purchases', { description, items, discount, date, title, transactions });

  return data;
}

export async function updatePurchase({ description, items = [], discount = 0, date, id, title, transactions }) {
  const data = await axios.put(`/purchases/${id}`, { description, items, discount, date, title, transactions });

  return data;
}
