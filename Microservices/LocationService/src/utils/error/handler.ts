export const handleError = (res, error) => {
    res.status(500).json({ error: error.message || "Internal Server Error" });
};
