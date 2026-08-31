export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

export const sendError = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
