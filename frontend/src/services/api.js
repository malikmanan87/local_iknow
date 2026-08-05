import axios from 'axios';

const getBaseUrls = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    if (window.location.port === '5173') {
      return {
        api: 'http://localhost/iknow/public/api',
        upload: 'http://localhost/iknow/public/'
      };
    }

    const cleanPath = pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return {
      api: origin + cleanPath + 'api',
      upload: origin + cleanPath
    };
  }
  return {
    api: 'http://localhost/iknow/public/api',
    upload: 'http://localhost/iknow/public/'
  };
};

const urls = getBaseUrls();
export const API_BASE_URL = urls.api;
export const UPLOAD_BASE_URL = urls.upload;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getModules = () => api.get('/modules');
export const getModuleDetail = (id) => api.get('/modules/' + id);
export const createModule = (data) => api.post('/modules', data);
export const updateModule = (id, data) => api.put('/modules/' + id, data);
export const deleteModule = (id) => api.delete('/modules/' + id);

export const createSubmodule = (data) => api.post('/submodules', data);
export const deleteSubmodule = (id) => api.delete('/submodules/' + id);

export const createFlow = (data) => api.post('/flows', data);
export const deleteFlow = (id) => api.delete('/flows/' + id);

export const createIssue = (data) => api.post('/issues', data);
export const deleteIssue = (id) => api.delete('/issues/' + id);

export const createContact = (data) => api.post('/contacts', data);
export const deleteContact = (id) => api.delete('/contacts/' + id);

export const uploadImage = (formData) => {
  return axios.post(API_BASE_URL + '/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;

export const updateSubmodule = (id, data) => api.put('/submodules/' + id, data);
export const updateFlow = (id, data) => api.put('/flows/' + id, data);
export const updateIssue = (id, data) => api.put('/issues/' + id, data);
export const updateContact = (id, data) => api.put('/contacts/' + id, data);
export const searchSystem = (q) => api.get('/search', { params: { q } });

export const getMirthStatus   = ()       => api.get('/mirth/status');
export const getMirthChannels = ()       => api.get('/mirth/channels');
export const getMirthMessages = (params) => api.get('/mirth/messages', { params });



