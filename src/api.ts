export const API_URL = 'http://localhost:8000/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
};

export const uploadDataset = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const getDatasets = async () => {
  const res = await fetch(`${API_URL}/datasets`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
};

export const getDatasetSummary = async (datasetId: string) => {
  const res = await fetch(`${API_URL}/data/${encodeURIComponent(datasetId)}/summary`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
};

export const getDatasetInsights = async (datasetId: string) => {
  const res = await fetch(`${API_URL}/data/${encodeURIComponent(datasetId)}/insights`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch AI insights');
  return res.json();
};

export const getChartData = async (datasetId: string, xCol: string, yCol: string, agg: string = 'sum') => {
  const res = await fetch(`${API_URL}/data/${encodeURIComponent(datasetId)}/chart-data?x_col=${encodeURIComponent(xCol)}&y_col=${encodeURIComponent(yCol)}&agg=${agg}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chart data');
  return res.json();
};

export const getPredictions = async (datasetId: string, dateCol: string, valueCol: string) => {
  const res = await fetch(`${API_URL}/data/${encodeURIComponent(datasetId)}/predictions?date_col=${encodeURIComponent(dateCol)}&value_col=${encodeURIComponent(valueCol)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch predictions');
  return res.json();
};

export const getForecastValidation = async (datasetId: string, valueCol: string) => {
  const res = await fetch(`${API_URL}/data/${encodeURIComponent(datasetId)}/forecast-validation?value_col=${encodeURIComponent(valueCol)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch validation');
  return res.json();
};

export const chatWithData = async (datasetId: string, message: string) => {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ dataset_id: datasetId, message })
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
};
