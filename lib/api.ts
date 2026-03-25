import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    // 'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const TestChat = async (
  message: string,
  path: string,
  mode: string,
  chatId: string,
  onChunk: (text: string) => void
) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(`${api.defaults.baseURL}/chat/${path}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message, mode, chatId }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = (await reader?.read()) || { done: true, value: undefined }
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split("\n\n").filter(Boolean)

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "")
        if (data === "[DONE]") return
        const parsed = JSON.parse(data)
        onChunk(parsed.text)
      }
    }
  }
}


export const postTest = async (topic: string, chatId: string) => {
  const res = await api.post('/chat/test', { topic, chatId })
  return res.data
}


export const renameChat = async (chatId: string, title: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${api.defaults.baseURL}/chat/rename`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ chatId, title })
  });
  return res.json();
}

export default api;
