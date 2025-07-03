import { LocalTextGroupEntry } from "../wsi-proxy-api";

export interface ValidateOpResponse {
  CommentRule?: string;
  IncrVersion?: boolean;
  IsFourEyesEnabled?: boolean;
  Log?: boolean;
  ReAuthentication?: string;
  PredefinedComments?: LocalTextGroupEntry[];
}
