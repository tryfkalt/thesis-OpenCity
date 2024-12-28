import { createSlice } from "@reduxjs/toolkit";

const userLocationSlice = createSlice({
  name: "userLocation",
  initialState: { lat: null, lng: null }, // Initial state for user's location
  reducers: {
    setUserLocation: (state, action) => {
      state.lat = action.payload.lat;
      state.lng = action.payload.lng;
    },
  },
});

// Export the actions
export const { setUserLocation } = userLocationSlice.actions;

// Export the reducer
export default userLocationSlice.reducer;
