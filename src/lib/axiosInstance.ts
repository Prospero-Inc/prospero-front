import axios from 'axios'

const axiosInstance = axios.create({
  // On the server, reach the backend over the internal Docker network
  // instead of going back out through Caddy (which would replace the
  // client's X-Forwarded-For with this server's IP). Not inlined into the
  // client bundle, so the browser keeps NEXT_PUBLIC_API_URL.
  baseURL: process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL
})

export default axiosInstance
