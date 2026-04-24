import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  reviewsByRestaurant: {}, // Maps restaurant_id to an array of reviews
  loading: false,
  error: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    // Standard fetching
    fetchReviewsSuccess: (state, action) => {
      const { restaurantId, reviews } = action.payload;
      state.reviewsByRestaurant[restaurantId] = reviews;
    },
    
    // Optimistic Update for Kafka Flow
    addReviewOptimistic: (state, action) => {
      const { restaurantId, review } = action.payload;
      if (!state.reviewsByRestaurant[restaurantId]) {
        state.reviewsByRestaurant[restaurantId] = [];
      }
      // Add the pending review to the top of the list
      state.reviewsByRestaurant[restaurantId].unshift({
        ...review,
        status: 'pending_kafka_processing' 
      });
    }
  },
});

export const { fetchReviewsSuccess, addReviewOptimistic } = reviewSlice.actions;
export default reviewSlice.reducer;