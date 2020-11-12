import { IProperty, Property } from './Property';

export enum EEntityType {
  DRUG = 'drug',
  MEDICINAL_PRODUCT = 'medicinal_product',
  OTHER = 'other',
}

export enum EEntityField {
  CODE = 'code',
  DESCRIPTION = 'description',
  TYPE = 'type',
}

// TODO: complete EEntityType enum.
export interface IEntity {
  code: string;
  description: string;
  type: EEntityType | string;
  children?: IEntity[];
  properties?: IProperty[];
  product?: IEntity;
}

export class Entity implements IEntity {
  readonly code: string;
  readonly description: string;
  readonly type: string;
  readonly children?: Entity[];
  readonly properties?: Property[];

  constructor(entity: IEntity) {
    this.code = entity.code;
    this.description = entity.description;
    this.type = entity.type;
    this.children = entity.children?.map((child: IEntity) => new Entity(child));
    this.properties = entity.properties?.map((property: IProperty) => new Property(property));
  }

  getChild(code: string): Entity {
    const [entity] = this.children?.filter((child: IEntity) => child.code === code) ?? [];
    return entity;
  }

  getProperty(type: string): Property {
    const [property] =
      this.properties?.filter((property: IProperty) => property.type === type) ?? [];
    return property;
  }

  matchesCode(pattern: string): boolean {
    return this.code.toLowerCase().includes(pattern.toLowerCase());
  }

  matchesDescription(pattern: string): boolean {
    return this.description.toLowerCase().includes(pattern.toLowerCase());
  }

  matchesType(pattern: string): boolean {
    return this.type.toLowerCase().includes(pattern.toLowerCase());
  }

  matchesProperty(property: Property): boolean {
    return this.properties?.includes(property) ?? false;
  }
}

export default Entity;