import { configureStore } from "@reduxjs/toolkit";
import userLocationReducer from "./userLocationSlice";

const store = configureStore({
  reducer: {
    userLocation: userLocationReducer,
  },
});

export default store;
