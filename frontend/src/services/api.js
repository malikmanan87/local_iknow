import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
export const UPLOAD_BASE_URL = 'http://localhost:8080/';

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

export const createSubmodule = (data) => api.post('/submodules', data);
export const deleteSubmodule = (id) => api.delete('/submodules/' + id);
