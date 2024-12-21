const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "yellow";
    case "Active":
      return "blue";
    case "Canceled":
      return "red";
    case "Defeated":
      return "red";
    case "Succeeded":
      return "green";
    case "Queued":
      return "orange";
    case "Expired":
      return "gray";
    case "Executed":
      return "green";
    default:
      return "yellow";
  }
};

export default getStatusColor;