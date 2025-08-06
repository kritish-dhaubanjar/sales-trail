import axios from '@/lib/axios';

export async function get({ start_date, end_date }) {
  const data = await axios.get('/dashboard', { params: { start_date, end_date } });

  return data;
}
