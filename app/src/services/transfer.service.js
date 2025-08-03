import axios from '@/lib/axios';

export async function getTransfers({ page, limit, query }) {
  const data = await axios.get('/transfers', { params: { page, limit, q: query } });

  return data;
}

export async function deleteTransfer({ id }) {
  const data = await axios.delete(`/transfers/${id}`);

  return data;
}

export async function createTransfer({
  from_account_id,
  to_account_id,
  title,
  description,
  date,
  amount,
}) {
  const data = await axios.post('/transfers', {
    from_account_id,
    to_account_id,
    title,
    description,
    date,
    amount,
  });

  return data;
}

export async function updateTransfer({
  id,
  from_account_id,
  to_account_id,
  title,
  description,
  date,
  amount,
}) {
  const data = await axios.put(`/transfers/${id}`, {
    from_account_id,
    to_account_id,
    title,
    description,
    date,
    amount,
  });

  return data;
}
