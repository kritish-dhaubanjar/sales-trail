import axios from '@/lib/axios';

export async function getItems({ page, limit, query, category_type = '' }) {
  const data = await axios.get('/items', { params: { page, limit, q: query, category_type } });

  return data;
}

export async function deleteItem({ id }) {
  const data = await axios.delete(`/items/${id}`);

  return data;
}

export async function createItem({ name, price, unit_id, description, category_id }) {
  const data = await axios.post('/items', { name, price, unit_id, description, category_id });

  return data;
}

export async function updateItem({ name, id, price, unit_id, description, category_id }) {
  const data = await axios.put(`/items/${id}`, { name, price, unit_id, description, category_id });

  return data;
}
