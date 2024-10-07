import axios from '@/lib/axios';

export async function getItems({ page, limit, query }) {
  const data = await axios.get('/items', { params: { page, limit, q: query } });

  return data;
}

export async function deleteItem({ id }) {
  const data = await axios.delete(`/items/${id}`);

  return data;
}

export async function createItem({ name, price, unit_id, description }) {
  const data = await axios.post('/items', { name, price, unit_id, description });

  return data;
}

export async function updateItem({ name, id, price, unit_id, description }) {
  const data = await axios.put(`/items/${id}`, { name, price, unit_id, description });

  return data;
}
