import { Property } from './Property';

export enum EEntityType {
  DRUG = 'drug',
  MEDICINAL_PRODUCT = 'medicinal_product',
  OTHER = 'other',
}

export enum EEntityField {
  CODE = 'code',
  DESCRIPTION = 'description',
  TYPE = 'type'
}

// TODO: complete EEntityType enum.
export interface IEntity {
  code: string;
  description: string;
  type: EEntityType | string;
  properties?: Property[];
}

export class Entity implements IEntity {
  private _code: string;
  private _description: string;
  private _type: string;
  private _properties?: Property[];

  constructor(entity: IEntity) {
    this._code = entity.code;
    this._description = entity.description;
    this._type = entity.type;
    this._properties = entity.properties;
  }

  get code(): string {
    return this._code;
  }

  get description(): string {
    return this._description;
  }

  get type(): string {
    return this._type;
  }

  get properties(): Property[] | undefined {
    return this._properties;
  }

  matchesCode(pattern: string) {
    return this.code.toLowerCase().includes(pattern.toLowerCase());
  }

  matchesDescription(pattern: string) {
    return this.description.toLowerCase().includes(pattern.toLowerCase());
  }

  matchesType(pattern: string) {
    return this.type.toLowerCase().includes(pattern.toLowerCase());
  }

  matchesProperty(property: Property) {
    return this.properties?.includes(property);
  }
}

export default Entity;
