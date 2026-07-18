import api from "./axios";

export const submitFeedback = (data) => {
  return api.post("/feedback/", data);
};