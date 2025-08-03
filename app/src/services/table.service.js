import axios from '@/lib/axios';

export async function getTable({ id }) {
  const data = await axios.get(`/tables/${id}`);

  return data;
}

export async function getTables({ page, limit, query }) {
  const data = await axios.get('/tables', { params: { page, limit, q: query } });

  return data;
}

export async function deleteTable({ id }) {
  const data = await axios.delete(`/tables/${id}`);

  return data;
}

export async function createTable({ name }) {
  const data = await axios.post('/tables', { name });

  return data;
}

export async function updateTable({ name, id }) {
  const data = await axios.put(`/tables/${id}`, { name });

  return data;
}

export async function checkoutTable({ id, date, discount, items, title, transactions }) {
  const data = await axios.put(`/tables/${id}/checkout`, { date, discount, items, title, transactions });

  return data;
}

export async function updateTableItems({ id, items }) {
  const data = await axios.put(`/tables/${id}/items`, { items });

  return data;
}

export async function deleteTableItems({ id }) {
  const data = await axios.delete(`/tables/${id}/items`);

  return data;
}
