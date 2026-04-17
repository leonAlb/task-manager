declare namespace Express {
  interface Request {
    user: {
      sub: number;
      email: string;
    };
  }
}
