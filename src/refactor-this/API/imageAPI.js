import request from "./baseAPI";

export const getImages = (category, page = 1) => {
  // Validate inputs early to avoid sending malformed requests to the legacy API.
  if (typeof category !== "string" || category.trim() === "") {
    throw new TypeError("category must be a non-empty string");
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new TypeError("page must be an integer >= 1");
  }

  const encodedCategory = encodeURIComponent(category);
  return request.get(`/images?category=${encodedCategory}&page=${page}`);
};
