const convertScaledCoordinate = (bigNumberValue, scalingFactor) => {
  // Convert BigNumber to a JavaScript number or string
  const scaledValue = bigNumberValue.toNumber(); // or bigNumberValue.toNumber() if it's safe
  return scaledValue / scalingFactor; // Scale it back to the original value
}

export { convertScaledCoordinate };