export const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'Knowledge-to-Action backend is running'
  });
};
