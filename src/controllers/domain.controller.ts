import { Request, Response } from 'express';

export const signOperator = (req: Request, res: Response) => {
    res.json({ message: "Sign operator" });
};