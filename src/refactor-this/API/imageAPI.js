import request from "./baseAPI";

export const getImages = (category, page = 1) =>
  request.get(`/images?category=${category}&page=${page}`);
