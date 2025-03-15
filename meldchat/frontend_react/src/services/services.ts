import axios from 'axios';
import { getCSRFToken } from '../utilities/csrf';
import { isDevelopment } from '../utilities';

import { useQuery, useMutation } from 'react-query';

axios.defaults.headers.common['X-CSRFToken'] = getCSRFToken()!;
axios.defaults.baseURL = isDevelopment() ? `http://localhost:4000/api/v1/` : `https://${window.location.host}/api/v1/`;
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

// Define the structure for user data
type UserData = {
    role: string;
    email: string;
};

// Define the structure for social media data
type SocialMediaData = {
    type: string;
    username: string;
    is_primary: boolean;
};

// Define the structure for directory listing data
type DirectoryListingData = {
    country_id?: number;
    state_id?: number;
    city_id?: number;
    name: string;
    bio_text: string;
    is_admin_approved?: boolean;
    created_at?: string;  // Assuming date is returned as a string
    updated_at?: string;  // Assuming date is returned as a string
    social_medias: SocialMediaData[];
};

// Define the structure for the entire user profile response
type UserProfileData = {
    user_data: UserData;
    directory_listing: DirectoryListingData;
};

export const useFetchUserProfile = () => {
  const fetchUserProfile = async (): Promise<UserProfileData> => {
    const response = await axios.get<UserProfileData>('profile/');
    return response.data;
  };

  return useQuery('userProfile', fetchUserProfile, { retry: false, onError: () => {} });
};

export type RegisterRequestData = {
  email: string;
  display_name: string;
  username: string;
  password: string;
  date_of_birth: string;
};

type UseRegisterUserOptions = {
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
};

export const useRegisterUser = (options?: UseRegisterUserOptions) => {
  const register = async (data: RegisterRequestData) => {
    try {
      const response = await axios.post(`register/`, data);
      return response.data;
    } catch (error) {
      console.error('Error during user register:', error);
      throw error;
    }
  };

  return useMutation(register, {
    onError: options?.onError,
    onSuccess: options?.onSuccess,
  });
};


export type LoginRequestData = {
    email: string;
    password: string;
};

export const useLoginUser = () => {
  const login = async (data: LoginRequestData) => {
    try {
      const response = await axios.post(`login/`, data);
      return response.data;
    } catch (error) {
      console.error('Error during user login:', error);
      throw error;
    }
  };

  return useMutation(login);
};

export const useLogoutUser = () => {
  const logout = async () => {
    try {
      const response = await axios.post(`logout/`);
      return response.data;
    } catch (error) {
      console.error('Error during user logout:', error);
      throw error;
    }
  };

  return useMutation(logout);
};

import axios from 'axios';

// Define the structure for city data
type City = {
    id: number;
    name: string;
};

// Define the structure for state data
type State = {
    id: number;
    name: string;
    cities: City[];
};

// Define the structure for country data
type Country = {
    id: number;
    name: string;
    states: State[];
};

// Define the structure for the entire geographic data
type GeoData = Country[];

export const useFetchGeoData = () => {
  const fetchGeoData = async (): Promise<GeoData> => {
    try {
      const response = await axios.get<GeoData>('geo-data/');
      return response.data;
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      throw error;
    }
  };

  return useQuery('geoData', fetchGeoData);
};

// Define the structure for parameters when fetching directory listings
type FetchDirectoryListingParams = {
    country_id?: number;
    state_id?: number;
    city_id?: number;
};

// Function to fetch filtered directory listings
export const useFetchDirectoryListings = (params: FetchDirectoryListingParams) => {
  const fetchDirectoryListings = async (): Promise<DirectoryListingData[]> => {
    try {
      const response = await axios.get<DirectoryListingData[]>('directory/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching directory listings:', error);
      throw error;
    }
  };

  return useQuery(['directoryListings', params], fetchDirectoryListings);
};

// Define the structure for the request body when creating a new directory listing
type CreateDirectoryListingRequest = {
    name: string;
    bio_text: string;
    country_id?: number;
    state_id?: number;
    city_id?: number;
    social_medias?: SocialMediaData[];
};

// Function to create a new or update a directory listing
export const useUpdateDirectoryListing = () => {
  const updateDirectoryListing = async (data: CreateDirectoryListingRequest): Promise<{ id: number }> => {
    try {
      const response = await axios.post<{ id: number }>('directory/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating directory listing:', error);
      throw error;
    }
  };

  return useMutation(updateDirectoryListing);
};
