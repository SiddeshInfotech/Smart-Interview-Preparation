import api from "./axios";

export const fetchAvailableDomains = () => api.get("/domains/");

export const fetchActiveDomain = () => api.get("/profile/active-domain/");

export const switchActiveDomain = (domainId) =>
  api.put("/profile/active-domain/", { domain_id: domainId });

export const fetchCourseBootstrap = () => api.get("/courses/bootstrap/");

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

export const toggleModuleCompletion = (moduleId, domainId) =>
  api.post(`/modules/${moduleId}/toggle-complete/`, { domain_id: domainId });

export const toggleTopicCompletion = toggleModuleCompletion;

export const fetchCourseProgress = () => api.get("/course-progress/");

