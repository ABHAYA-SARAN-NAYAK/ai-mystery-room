import { IPlayerSession, IMysteryCase } from '../models/index';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      session?: IPlayerSession;
      mysteryCase?: IMysteryCase;
    }
  }
}
