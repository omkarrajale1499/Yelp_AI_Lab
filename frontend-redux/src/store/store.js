import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import restaurantReducer from './restaurantSlice';
import reviewReducer from './reviewSlice';
import favouritesReducer from './favouritesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantReducer,
    reviews: reviewReducer,
    favourites: favouritesReducer,
  },
});

export default store;