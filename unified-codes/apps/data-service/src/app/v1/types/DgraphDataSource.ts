import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest';

import {
  EEntityCategory,
  EEntityType,
  EEntityField,
  IEntity,
  EntityCollection,
  IEntityCollection,
  IProperty,
} from '@unified-codes/data/v1';

import { EntitySearchInput, FilterMatch } from '../schema';

export class DgraphDataSource extends RESTDataSource {
  private static headers: { [key: string]: string } = {
    'Content-Type': 'application/graphql+-',
  };

  private static paths: { [key: string]: string } = {
    query: 'query',
  };

  private static getEntitiesOrderString(
    orderField: string = EEntityField.DESCRIPTION,
    orderDesc = false
  ) {
    const orderBy = orderField === EEntityField.DESCRIPTION ? 'name' : orderField;
    const orderString = `${orderDesc ? 'orderdesc' : 'orderasc'}: ${orderBy}`;
    return orderString;
  }

  private static getEntityTypeString(types: string[]) {
    return JSON.stringify(types.map(type => {
      switch (type) {
        case EEntityType.FORM_CATEGORY:
        case EEntityType.FORM:
          return 'Form';
        case EEntityType.UNIT_OF_USE:
        case EEntityType.STRENGTH:
          return 'Unit';
        case EEntityType.DRUG:
        default:
          return 'Product';
      }
    }));
  }

  private static getEntityCategoryString(categories: string[]) {
    return JSON.stringify(categories.map(category => {
      switch(category) {
        case EEntityCategory.DRUG:
          return 'Drug';
        case EEntityCategory.MEDICINAL_PRODUCT:
          return 'Consumable';
        case EEntityCategory.OTHER:
          return 'Other';
      }
    }));
  }

  private static getEntityQuery(code: string) {
    return `{
      query(func: eq(code, ${code?.toLowerCase()}), first:1) @recurse(loop:false) {
        code
        type: dgraph.type
        description: name@*
        value
        combines
        children
        parents: ~children
        properties
      }
    }`;
  }

  private static getProductQuery(code: string) {
    return `{
      query (func: eq(dgraph.type, "Product")) @cascade {
        code
        type: dgraph.type
        description: name@*
        properties {
          type: dgraph.type
          value
        }
        children {
          children {
            children @filter(alloftext(code, ${code})) {
            }
          }
        }
      }
    }`;
  }

  private static getEntitiesFilterString(description: string, match: FilterMatch) {
    if (!description) {
      return '@filter(has(name))';
    }

    switch (match) {
      case 'exact':
        return `@filter(regexp(name, /^${description}$/i))`;

      case 'contains':
        return `@filter(regexp(name, /${description}/i))`;

      default:
        return `@filter(regexp(name, /^${description}/i))`;
    }
  }

  private static getEntitiesQuery(
    types: string[],
    categories?: string[],
    description?: string,
    orderField?: string,
    orderDesc?: boolean,
    first?: number,
    offset?: number,
    match?: FilterMatch
  ) {
    const typeString = this.getEntityTypeString(types);    
    const categoryString = this.getEntityCategoryString(categories);
    const orderString = this.getEntitiesOrderString(orderField, orderDesc);
    const filterString = this.getEntitiesFilterString(description, match);
  
    const isMsupply = types.includes(EEntityType.UNIT_OF_USE);

    if (isMsupply) {
      return `{
        all as counters(func: eq(dgraph.type, ${typeString})) ${filterString} @cascade { 
          ~children @filter(eq(name, ${categoryString}))
          total: count(uid)
        }
        
        query(func: uid(all), ${orderString}, offset: ${offset}, first: ${first})  {
          code
          description: name@*
          type: dgraph.type
          uid
          properties {
            type: dgraph.type
            value
          }
          parents: ~children {
            type: dgraph.type
            description: name@*
          }
          children {
            description: name@*
            type: dgraph.type
            children {
              description: name@*
              type: dgraph.type
              properties {
                type: dgraph.type
                value
              }
              children {
                code
                description: name@*
                type: dgraph.type
                properties {
                  type: dgraph.type
                  value
                }
                children {
                  code
                  description: name@*
                  type: dgraph.type
                  properties {
                    type: dgraph.type
                    value
                  }
                }
              }
            }
          }
        }
      }`
    }

    return `{
      all as counters(func: eq(dgraph.type, ${typeString})) ${filterString} @cascade { 
        ~children @filter(eq(name, ${categoryString}))
        total: count(uid)
      }
      
      query(func: uid(all), ${orderString}, offset: ${offset}, first: ${first})  {
        code
        description: name@*
        type: dgraph.type
        uid
        properties {
          type: dgraph.type
          value
        }
        parents: ~children {
          type: dgraph.type
          description: name@*
        }
      }
    }`;    
  }

  private static getEntityType(entity: IEntity): string {
    const { type: types } = entity;
    const [type] = types ?? [];

    switch (type) {
      case 'Product':
        const [parent] = entity.parents ?? [];
        switch (parent?.description) {
          case 'Consumable':
            return EEntityCategory.MEDICINAL_PRODUCT;
          case 'Other':
            return EEntityCategory.OTHER;
          default:
            return EEntityCategory.DRUG;
        }
      case 'Route':
        return EEntityType.FORM_CATEGORY;
      case 'DoseForm':
      case 'DoseFormQualifier':
        return EEntityType.FORM;
      case 'DoseStrength':
        return EEntityType.STRENGTH;
      case 'DoseUnit':
        return EEntityType.UNIT_OF_USE;
      default:
        return 'n/a';
    }
  }

  // maps from the `type` property returned, which is of `dgraph.type` and therefore string[]
  // to a single string value for `type`
  private static getPropertyType(property: IProperty): string {
    const { type: types } = property;
    const [type] = types ?? [];
    return type;
  }

  private static mapEntity = (entity: IEntity) => {
    if (!entity) return entity;

    // Map native graph node types.
    const type = DgraphDataSource.getEntityType(entity);
    const children = entity.children?.map((child) => DgraphDataSource.mapEntity(child));

    entity.properties = entity.properties?.map((property) => ({
      ...property,
      type: DgraphDataSource.getPropertyType(property),
    }));

    return { ...entity, type, children };
  };

  constructor() {
    super();
    this.baseURL = `${process.env.NX_DGRAPH_SERVICE_URL}:${process.env.NX_DGRAPH_SERVICE_PORT}`;
  }

  willSendRequest(request: RequestOptions): void {
    Object.entries(DgraphDataSource.headers).forEach(([key, value]) =>
      request.headers.set(key, value)
    );
  }

  async getEntity(code: string): Promise<IEntity> {
    const data = await this.postQuery(DgraphDataSource.getEntityQuery(code));
    const { query } = data ?? {};
    const [entity]: [IEntity] = query ?? [];

    return DgraphDataSource.mapEntity(entity);
  }

  async getProduct(code: string): Promise<IEntity> {
    const data = await this.postQuery(DgraphDataSource.getProductQuery(code));

    const { query } = data ?? {};
    const [entity] = query ?? [];

    return DgraphDataSource.mapEntity(entity);
  }

  async getEntities(
    filter?: EntitySearchInput,
    first?: number,
    offset?: number
  ): Promise<IEntityCollection> {
    const { categories = [EEntityCategory.DRUG, EEntityCategory.MEDICINAL_PRODUCT, EEntityCategory.OTHER], type = EEntityType.DRUG, description, match, orderBy } = filter ?? {};
    const { field: orderField = EEntityField.DESCRIPTION, descending: orderDesc = false } =
      orderBy ?? {};
    
    const types = type.replace(/[[\]]+/g, '').split(/[\s,]+/);

    // Backwards compatibility until mSupply can be migrated.
    const isMsupply = types.includes(EEntityType.UNIT_OF_USE);

    const data = await this.postQuery(
      DgraphDataSource.getEntitiesQuery(
        types,
        categories,
        description,
        orderField,
        orderDesc,
        first,
        offset,
        match
      )
    );

    const { counters: countersData, query: entityData } = data ?? {};
    const [counterData] = countersData ?? [];
    const totalCount = counterData?.total ?? 0;

    const entities: IEntity[] = entityData?.map((entity: IEntity) => {
      // Overwrite interactions to prevent large query delays.
      const interactions = [];

      return { ...DgraphDataSource.mapEntity(entity), interactions };
    });


    if (isMsupply) {
      const mSupplyEntities = [];
      entities.forEach(product => {
        if (product.children) {
          product.children.forEach(route => {
            if (route.children) {
              route.children.forEach(doseForm => {
                if (doseForm.children) {
                  doseForm.children.forEach(doseQualifierOrDoseStrength => {
                      if (doseQualifierOrDoseStrength.children) {
                        doseQualifierOrDoseStrength.children.forEach(doseStrength => {
                          const { code } = doseStrength;
                          const { type } = product;

                          const { description: productDescription } = product;
                          const { description: routeDescription } = route;
                          const { description: doseFormDescription } = doseForm;
                          const { description: doseQualifierDescription } = doseQualifierOrDoseStrength;
                          const { description: doseStrengthDescrpition }= doseStrength;

                          const description = `${productDescription} ${routeDescription} ${doseFormDescription} ${doseQualifierDescription} ${doseStrengthDescrpition}`;

                          mSupplyEntities.push({
                            code,
                            type,
                            description
                          });
                        })
                      }
                      else {
                        const { code } = doseQualifierOrDoseStrength;
                        const { type } = product;

                        const { description: productDescription } = product;
                        const { description: routeDescription } = route;
                        const { description: doseFormDescription } = doseForm;
                        const { description: doseStrengthDescription } = doseQualifierOrDoseStrength;

                        const description = `${productDescription} ${routeDescription} ${doseFormDescription} ${doseStrengthDescription}`;

                        mSupplyEntities.push({
                          code,
                          type,
                          description
                        });
                      }
                  })
                }
              })
            }
          })
        }
      });

      const mSupplyEntityCount = mSupplyEntities.length;

      return new EntityCollection(mSupplyEntities, mSupplyEntityCount);
    }

    return new EntityCollection(entities, totalCount);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async postQuery(query: string): Promise<any> {
    const response = await this.post(DgraphDataSource.paths.query, query);
    const { data } = response;
    return data;
  }
}
