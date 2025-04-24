import { Response } from "express";

export const createApiResponse = (
  res: Response,
  message: string,
  status: number,
  data: any = null
): Response => {
  const success = status >= 200 && status < 300;
  return res.status(status).json({
    success,
    ...(success ? { message } : { error: message || "An error occurred" }),
    data: success ? data : null,
    timestamp: new Date().toISOString(),
  });
};
