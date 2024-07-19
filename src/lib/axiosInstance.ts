import axios from 'axios'
const { NEXT_PUBLIC_URL } = process.env
const axiosInstance = axios.create({
  baseURL: NEXT_PUBLIC_URL
})

export default axiosInstance
