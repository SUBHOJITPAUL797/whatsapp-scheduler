import axios from 'axios';

// Render provides VITE_API_HOST (domain only) via render.yaml
// Or we can assume relative path if served from same domain, but here they are different services.
// Let's try to construct it.
const apiDomain = import.meta.env.VITE_API_HOST;
const API_URL = apiDomain ? `https://${apiDomain}` : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

const api = axios.create({
    baseURL: API_URL,
});

export interface Group {
    id: string;
    jid: string;
    name: string;
}

export interface Campaign {
    id: string;
    name: string;
    messageText: string;
    startTime: string;
    endTime: string;
    lastMinute: number;
    isActive: boolean;
    groupId?: string;
    _count?: {
        deliveries: number;
    };
}

export interface Delivery {
    id: string;
    campaignId: string;
    hourKey: string;
    sentAt: string;
    status: string;
    campaign: Campaign;
}

export const getGroups = async () => (await api.get<Group[]>('/groups')).data;
export const createGroup = async (data: { jid: string; name: string }) => (await api.post<Group>('/groups', data)).data;
export const deleteGroup = async (id: string) => (await api.delete(`/groups/${id}`)).data;

export const getCampaigns = async () => (await api.get<Campaign[]>('/campaigns')).data;
export const createCampaign = async (data: { name: string; messageText: string; startTime: string; endTime: string; groupId?: string }) => (await api.post<Campaign>('/campaigns', data)).data;
export const updateCampaign = async (id: string, data: Partial<Campaign>) => (await api.put<Campaign>(`/campaigns/${id}`, data)).data;
export const deleteCampaign = async (id: string) => (await api.delete(`/campaigns/${id}`)).data;

export const getDeliveries = async () => (await api.get<Delivery[]>('/deliveries')).data;

export default api;
