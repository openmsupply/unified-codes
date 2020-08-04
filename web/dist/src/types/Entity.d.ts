import { Property } from "./Property";
export declare type Entity = {
  code: string;
  description: string;
  type: string;
  properties?: Property[];
};
export default Entity;
