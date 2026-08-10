import api from "./axios";

export const fetchAvailableDomains = () => api.get("/domains/");

export const fetchActiveDomain = () => api.get("/profile/active-domain/");

export const switchActiveDomain = (domainId) =>
  api.put("/profile/active-domain/", { domain_id: domainId });

export const fetchDomainCourses = (domainId) =>
  api.get(`/domains/${domainId}/courses/`);

export const fetchCourseDetails = (courseId, domainId) =>
  api.get(`/courses/${courseId}/`, {
    params: domainId ? { domain_id: domainId } : {},
  });

export const fetchCourseModules = (courseId, domainId) =>
  api.get(`/courses/${courseId}/modules/`, {
    params: domainId ? { domain_id: domainId } : {},
  });

export const toggleTopicCompletion = (topicId, domainId) =>
  api.post(`/topics/${topicId}/toggle-complete/`, { domain_id: domainId });

export const fetchTopicMaterials = (topicId) =>
  api.get(`/topics/${topicId}/materials/`);

export const fetchCourseProgress = () => api.get("/course-progress/");
