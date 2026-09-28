import axios from "axios";
import { getItem, setItem, removeItem } from "../utils/storage";
import { router, Href } from "expo-router";
import { AppAlertStatic } from "../components/ui/AppAlert";

const baseURL = "https://devapi.office-saas.com/api/v1";

const axiosClient = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// The Request Interceptor: Automatically injects bearer tokens into HTTP headers
axiosClient.interceptors.request.use(
  async (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    try {
      const token = await getItem("saas_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const overrideOfficeId = await getItem("saas_override_office_id");
      if (overrideOfficeId && config.headers) {
        config.headers['X-Office-Id'] = overrideOfficeId;
      }
    } catch (e) {}
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

// Keep track of refresh state and request queue
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  refreshQueue = [];
};

// The Response Interceptor: Catches 401s and attempts to refresh the token silently
axiosClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('[API Error]', error.message, 'URL:', error.config?.url, 'Response:', error.response?.data);
    const originalRequest = error.config;
    
    // If the database was wiped or out of sync (common in dev), force logout
    if (error.response?.status === 400 && error.response?.data?.message === 'Office profile not found.') {
       await removeItem("saas_token");
       await removeItem("saas_refresh_token");
       router.replace("/" as Href);
       return Promise.reject(error);
    }

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = await getItem("saas_refresh_token");
        if (refreshToken) {
          try {
            const res = await axios.post(`${baseURL}/Auth/refresh`, { refreshToken });
            
            if (res.data.isSuccess) {
              const newAccessToken = res.data.data.token;
              const newRefreshToken = res.data.data.refreshToken;
              
              // Store new tokens
              await setItem("saas_token", newAccessToken);
              await setItem("saas_refresh_token", newRefreshToken);
              
              // Resolve all queued requests with the new token
              processQueue(null, newAccessToken);
              
              // Retry the original request
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              }
              return axiosClient(originalRequest);
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            // If refresh fails, clear storage and redirect to login
            await removeItem("saas_token");
            await removeItem("saas_refresh_token");
            router.replace("/" as Href);
            return Promise.reject(refreshError);
          }
        }
      } catch (storeError) {
         // Storage error fallback
         router.replace("/" as Href);
      } finally {
        isRefreshing = false;
      }
    } else {
      // It's not a 401. Let's handle it globally so components don't have to duplicate error logic.
      if (error.response) {
        // The request was made and the server responded with a status code out of the range of 2xx
        if (error.response.status >= 500) {
           AppAlertStatic.alert("Server Error", "Something went wrong on our end. Please try again later.");
        } else if (error.response.status === 403) {
           AppAlertStatic.alert("Access Denied", "You don't have permission to perform this action.");
        }
      } else if (error.request) {
        // The request was made but no response was received (Network error)
        AppAlertStatic.alert("Network Error", "Unable to connect to the server. Please check your internet connection.");
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
