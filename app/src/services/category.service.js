import axios from '@/lib/axios';

export async function getCategories({ page, limit, query }) {
  const data = await axios.get('/categories', { params: { page, limit, q: query } });

  return data;
}

export async function deleteCategory({ id }) {
  const data = await axios.delete(`/categories/${id}`);

  return data;
}

export async function createCategory({ name }) {
  const data = await axios.post('/categories', { name });

  return data;
}

export async function updateCategory({ name, id }) {
  const data = await axios.put(`/categories/${id}`, { name });

  return data;
}
