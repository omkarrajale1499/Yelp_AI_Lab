import { createSlice } from '@reduxjs/toolkit';

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState: {
    items: [], // Array of restaurant IDs
    loading: false,
    error: null,
  },
  reducers: {
    addFavourite: (state, action) => {
      // Prevent duplicates
      if (!state.items.includes(action.payload)) {
        state.items.push(action.payload);
      }
    },
    removeFavourite: (state, action) => {
      state.items = state.items.filter(id => id !== action.payload);
    },
    setFavourites: (state, action) => {
      state.items = action.payload;
    }
  }
});

export const { addFavourite, removeFavourite, setFavourites } = favouritesSlice.actions;
export default favouritesSlice.reducer;