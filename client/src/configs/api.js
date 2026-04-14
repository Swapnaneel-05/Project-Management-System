import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASEURL || "https://project-management-main-self-ashen.vercel.app",
})

export default api