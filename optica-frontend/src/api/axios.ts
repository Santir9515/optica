import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "X-Optica-Id": "optica-principal",
  },
});
console.log("API BASE", import.meta.env.VITE_API_BASE_URL);

// Por ahora sin interceptor, hasta que usemos selector de óptica
export { api };
