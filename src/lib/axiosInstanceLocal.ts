import axios from 'axios'
console.log(process.env.NEXT_PUBLIC_API_URL)
const axiosInstance = axios.create({
  baseURL: '/api'
})

export default axiosInstance
