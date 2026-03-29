import axios from '@/lib/axios';
import { pick } from 'lodash';

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

export async function createTable({ name, is_delivery, account_id }) {
  const data = await axios.post('/tables', { name, is_delivery, account_id });

  return data;
}

export async function printTable({ id }) {
  const data = await axios.post(`/tables/${id}/print`);

  return data;
}

export async function updateTable({ name, id, account_id }) {
  const data = await axios.put(`/tables/${id}`, { name, account_id });

  return data;
}

export async function checkoutTable({ id, date, discount, items, title, transactions }) {
  const formattedItems = items.map((item) => pick(item, ['item_id', 'price', 'quantity']));

  const data = await axios.put(`/tables/${id}/checkout`, {
    date,
    discount,
    items: formattedItems,
    title,
    transactions,
  });

  return data;
}

export async function updateTableItems({ id, items }) {
  const formattedItems = items.map((item) => pick(item, ['item_id', 'price', 'quantity']));

  const data = await axios.put(`/tables/${id}/items`, { items: formattedItems });

  return data;
}

export async function deleteTableItems({ id }) {
  const data = await axios.delete(`/tables/${id}/items`);

  return data;
}

export async function transferTable({ id, table_id }) {
  const data = await axios.post(`/tables/${id}/transfer`, { table_id });

  return data;
}

export async function updateKOT({ id, printer_id }) {
  const data = await axios.post(`/tables/${id}/kot`, { printer_id });

  return data;
}

export async function updateTableDescription({ id, description }) {
  const data = await axios.patch(`/tables/${id}`, { description });

  return data;
}
