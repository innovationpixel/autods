import axiosInstance from './AxiosInstance';



export const getSourcingRequests = (params = {}) =>

    axiosInstance.get('/sourcing/requests', { params });



export const createSourcingRequest = (payload) =>

    axiosInstance.post('/sourcing/requests', payload);



export const refreshSourcingRequest = (id) =>

    axiosInstance.post(`/sourcing/requests/${id}/refresh`);



export const linkSourcingQuote = (id, quoteIndex) =>

    axiosInstance.post(`/sourcing/requests/${id}/link`, { quote_index: quoteIndex });



export const cancelSourcingRequest = (id) =>

    axiosInstance.post(`/sourcing/requests/${id}/cancel`);


