import { Response } from "express";

export interface SendResponseOptions<T> {
  httpStatusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(res: Response, options: SendResponseOptions<T>): void => {
  const { httpStatusCode, success, message, data } = options;
  res.status(httpStatusCode).json({ success, message, data });
};