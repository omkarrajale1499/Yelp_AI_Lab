import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  currentRestaurant: null,
  loading: false,
  error: null,
};

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    fetchRestaurantsStart: (state) => {
      state.loading = true;
    },
    fetchRestaurantsSuccess: (state, action) => {
      state.loading = false;
      state.list = action.payload;
    },
    fetchRestaurantsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentRestaurant: (state, action) => {
      state.currentRestaurant = action.payload;
    }
  },
});

export const { 
  fetchRestaurantsStart, 
  fetchRestaurantsSuccess, 
  fetchRestaurantsFailure,
  setCurrentRestaurant
} = restaurantSlice.actions;

export default restaurantSlice.reducer;