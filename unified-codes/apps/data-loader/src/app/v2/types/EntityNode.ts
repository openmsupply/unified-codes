export enum EEntityType {
  Root = 'Root',
  Category = 'Category',
  Product = 'Product',
  Route = 'Route',
  Form = 'Form',
  FormQualifier = 'FormQualifier',
  DoseStrength = 'DoseStrength',
  Unit = 'Unit',
  PackImmediate = 'PackImmediate',
  PackSize = 'PackSize',
  PackOuter = 'PackOuter',
  Manufacturer = 'Manufacturer',
  Brand = 'Brand',
}

export enum EPropertyType {
  RxNav = 'code_rxnav',
  WHOEML = 'who_eml',
  NZULM = 'code_nzulm',
  UNSPSC = 'code_unspsc',
}

export interface IPropertyNode {
  type?: string;
  value?: string;
}

export interface IEntityNode {
  code: string;
  name?: string;
  type?: EEntityType;
  combines?: IEntityNode[];
  properties?: IPropertyNode[];
  children?: IEntityNode[];
  value?: string;
}

export default IEntityNode;
