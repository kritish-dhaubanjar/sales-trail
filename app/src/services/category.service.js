import axios from '@/lib/axios';

export async function getCategories({ page, limit, query, category_type }) {
  const data = await axios.get('/categories', { params: { page, limit, q: query, category_type } });

  return data;
}

export async function deleteCategory({ id }) {
  const data = await axios.delete(`/categories/${id}`);

  return data;
}

export async function createCategory({ name, type }) {
  const data = await axios.post('/categories', { name, type });

  return data;
}

export async function updateCategory({ name, id, type }) {
  const data = await axios.put(`/categories/${id}`, { name, type });

  return data;
}
