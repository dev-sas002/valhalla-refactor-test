import axios from "axios";
import { BASE_URL } from "../constants/url";

const request = axios.create({
  baseURL: BASE_URL,
});

export default request;
