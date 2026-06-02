import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' }
});

export const getDashboard = async () => {
  const response = await client.get('/student/dashboard');
  return response.data;
};

export const fetchAIDialogue = async (payload: { prompt: string }) => {
  const response = await client.post('/ai/tutor', payload);
  return response.data;
};
