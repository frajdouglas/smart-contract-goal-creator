import axios from 'axios';

export const deleteAuthCookie = async () => {
  try {
    const response = await axios.post('/api/auth/sign-out');
    return response.data;
  } catch (error) {
    console.error("Error during backend sign out API call:", error);
    throw error;
  }
};