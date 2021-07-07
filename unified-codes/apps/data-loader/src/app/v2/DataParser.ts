import * as csv from 'csv-parser';
import * as fs from 'fs';

import {
  ICSVRow,
  ICSVData,
  IEntityGraph,
  IEntityNode,
  IPropertyNode,
  EEntityType,
  EPropertyType,
} from './types';

enum UCCode {
  Root = 'root',
  Drug = '933f3f00',
  Consumable = '77fcbb00',
}

enum UCName {
  Root = 'Root',
  Drug = 'Drug',
  Consumable = 'Consumable',
}

const UC_ENTITY: { [name: string]: IEntityNode } = {
  ROOT: {
    code: UCCode.Root,
    name: UCName.Root,
    type: EEntityType.Root,
    children: [],
    properties: [],
  },
  DRUG: {
    code: UCCode.Drug,
    name: UCName.Drug,
    type: EEntityType.Category,
    children: [],
    properties: [],
  },
  CONSUMABLE: {
    code: UCCode.Consumable,
    name: UCName.Consumable,
    type: EEntityType.Category,
    children: [],
    properties: [],
  },
};

export class DataParser {
  public readonly path: fs.PathLike;
  public readonly options:
    | string
    | {
        flags?: string;
        encoding?: BufferEncoding;
        fd?: number;
        mode?: number;
        autoClose?: boolean;
        emitClose?: boolean;
        start?: number;
        end?: number;
        highWaterMark?: number;
      };

  private data: ICSVData;
  private graph: IEntityGraph;
  private cycles: IEntityNode[];

  private isParsed: boolean;
  private isBuilt: boolean;
  private isTraversed: boolean;

  constructor(
    path: fs.PathLike,
    options?:
      | string
      | {
          flags?: string;
          encoding?: BufferEncoding;
          fd?: number;
          mode?: number;
          autoClose?: boolean;
          emitClose?: boolean;
          start?: number;
          end?: number;
          highWaterMark?: number;
        }
  ) {
    this.path = path;
    this.options = options;

    this.isParsed = false;
    this.isBuilt = false;
    this.isTraversed = false;

    this.data = [];
    this.graph = {};
    this.cycles = [];
  }

  public async parseData(): Promise<ICSVData> {
    if (this.isParsed) return this.data;

    const parseColumn = (column) => {
      const REGEX = {
        CR_LF: /[\r\n]/g,
        BRACKETED_DESCRIPTION: / *\([^)]*\) */g,
        SPACE: / /g,
      };

      return column
        .trim()
        .toLowerCase()
        .replace(REGEX.CR_LF, '')
        .replace(REGEX.BRACKETED_DESCRIPTION, '')
        .replace(REGEX.SPACE, '_');
    };

    // Read data stream.
    const stream = await fs.createReadStream(this.path, this.options);
    await new Promise((resolve) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          const entity = Object.entries<string>(row).reduce(
            (acc: ICSVRow, [column, value]: [string, string]) => {
              const key = parseColumn(column);
              return { ...acc, [key]: value };
            },
            {} as ICSVRow
          );
          this.data.push(entity);
        })
        .on('end', () => resolve(null));
    });

    return this.data;
  }

  public buildGraph(): IEntityGraph {
    if (this.isBuilt) return this.graph;

    // Initialise adjacency list for storing graph.
    this.graph = {
      [UC_ENTITY.ROOT.code]: UC_ENTITY.ROOT,
      [UC_ENTITY.DRUG.code]: UC_ENTITY.DRUG,
      [UC_ENTITY.CONSUMABLE.code]: UC_ENTITY.CONSUMABLE,
    };

    UC_ENTITY.ROOT.children = [UC_ENTITY.DRUG, UC_ENTITY.CONSUMABLE];

    try {
      // Initialise duplicate codes.
      const duplicates = [];

      // Parse entity graph.
      this.data.forEach((row) => {
        const productDefinition = [
          { name: row.product, code: row.uc2, type: EEntityType.Product },
          { name: row.route, code: row.uc3, type: EEntityType.Route },
          { name: row.dose_form, code: row.uc4, type: EEntityType.Form },
          { name: row.dose_qualification, code: row.uc5, type: EEntityType.FormQualifier },
          { name: row.strength, code: row.uc6, type: EEntityType.DoseStrength },
          { name: row.unit_of_presentation, code: row.uc7, type: EEntityType.Unit },
          { name: row.immediate_packaging, code: row.uc8, type: EEntityType.PackImmediate },
          { name: row.pack_size, code: row.uc9, type: EEntityType.PackSize },
          // { name: row.outer_packaging, code: row.uc10, type: EEntityType.PackOuter },
          // { name: row.manufacturer, code: row.uc11, type: EEntityType.Manufacturer },
          // { name: row.brand, code: row.uc12, type: EEntityType.Brand },
        ];

        const { uc1, combination } = row;

        const productProperties: IPropertyNode[] = [
          { type: EPropertyType.RxNav, value: row.rxnav },
          { type: EPropertyType.WHOEML, value: row.who_eml_product },
          { type: EPropertyType.NZULM, value: row.nzulm },
          { type: EPropertyType.UNSPSC, value: row.unspsc }
        ];

        const itemProperties: IPropertyNode[] = [
          { type: EPropertyType.WHOEML, value: row.who_eml_item },
          { type: EPropertyType.NZULM, value: row.nzulm_item },
        ];

        productDefinition.forEach(item => {
          if (!item.code) return;
          
          if (item.code in this.graph) {
            // check for conflicts.
            if (item.type && this.graph[item.code].type != item.type) {
              duplicates.push(item.code);
            }
          }
          else {
            const node = { 
              code: item.code,
              name: item.name,
              type: item.type,
              combines: [],
              children: [],
              properties: [], 
            }
            this.graph[item.code] = node;

            console.log(`INFO: Created ${item.type} node: ${JSON.stringify(node)}`);
          }
        });

        const productCode = productDefinition.find(item => item.type === EEntityType.Product)?.code;
        // If category code exists, and product code exists
        if (uc1 && productCode) {

          // link category to product.
          if (!this.graph[uc1].children.map((child) => child.code).includes(productCode)) {
            this.graph[uc1].children.push({ code: productCode });
            console.log(`INFO: Linked category with code ${uc1} to product with code ${productCode}`);
          }
        }

        // Iterate through and assign children to parents 
        // This starts at the top of the graph and for each node, finds the closest lower level node that has a code and name
        // This avoids having to manually define each combination of 'levels' that are able to be connected 
        let parentIndex = 0;
        let childIndex = 1;
        while (childIndex < productDefinition.length) {
          const parent = productDefinition[parentIndex];
          const child = productDefinition[childIndex];
          if (child.name && child.code) {
            if (!this.graph[parent.code].children.map((existingGraphChild) => existingGraphChild.code).includes(child.code)) {
              this.graph[parent.code].children.push(child);
              console.log(
                `INFO: Linked ${parent.type} with code ${parent.code} to ${child.type} with code ${child.code}`
              );
            }
            parentIndex = childIndex;
          }
          childIndex++;
        }

        // Parse product combinations.
        // TODO: consistent combination formatting.
        const combinations =
          combination
            ?.split(/[,/]/)
            .filter((uc) => !!uc)
            .map((uc) => uc.trim()) ?? [];

        // disabled for now as this creates a circular reference
        // // Link product to combination.
        // combinations.forEach((uc) => {
        //   if (uc2 && uc) {
        //     if (!this.graph[uc2].combines.map((sibling) => sibling.code).includes(uc)) {
        //       this.graph[uc2].combines.push({ code: uc });
        //       console.log(`INFO: Linked product with code ${uc2} to product with code ${uc}`);
        //     }
        //   }
        // });

        // Process external properties at product (UC2) level
        if (productCode) {
          productProperties.forEach((property) => {
            // temporary restriction for uc7 - these are not currently imported
            if (property.value) {
              console.log(
                `INFO: Property of type ${property.type} with value ${property.value} added for ${productCode}`
              );
              if (!this.graph[productCode].properties.some((p) => p.type === property.type)) {
                this.graph[productCode].properties.push(property);
              }
            }
          });
        }

        const strengthCode = productDefinition.find(item => item.type === EEntityType.DoseStrength)?.code;  // UC6
        const unitCode = productDefinition.find(item => item.type === EEntityType.Unit)?.code;      // UC7

        // Process external properties at item (UC6) level
        if (!unitCode && strengthCode) {
          itemProperties.forEach((property) => {
            // temporary restriction for uc7 - these are not currently imported
            if (property.value) {
              console.log(
                `INFO: Property of type ${property.type} with value ${property.value} added for ${strengthCode}`
              );
              if (!this.graph[strengthCode].properties.some((p) => p.type === property.type)) {
                this.graph[strengthCode].properties.push(property);
              }
            }
          });
        }
      });

      // Expand graph edges.
      Object.keys(this.graph).forEach((code) => {
        //this.graph[code].combines = this.graph[code].combines?.map((uc2) => this.graph[uc2.code]);
        this.graph[code].children = this.graph[code].children?.map((uc) => this.graph[uc.code]);
        console.log(`INFO: Expanded edges for node with code ${code}`);
      });

      // Traverse graph and update names.
      const updateName = (node, name = '') => {
        node.name = `${name} ${node.name}`;
        node.name = node.name.trim();
        console.log(`INFO: Renamed node with code ${node.code} to ${node.name}`);
        node.children?.forEach((child) => updateName(child, node.name));
      };

      this.graph[UCCode.Root].children?.forEach((category) => {
        category.children?.forEach((product) => updateName(product));
      });

      // Output warnings for any duplicate entity codes.
      duplicates.forEach((uc) => console.log(`WARNING: Detected duplicate code ${uc}!`));

      this.isBuilt = true;
    } catch (err) {
      console.error(err);
      this.isBuilt = false;
    } finally {
      return this.graph;
    }
  }

  public detectCycles(): IEntityNode[] {
    if (this.isTraversed) return this.cycles;

    const visited = {};
    const stack = [this.graph.root];
    while (stack.length > 0) {
      const entity = stack.pop();

      if (!visited[entity.code]) {
        visited[entity.code] = true;
      }

      if (entity.children) {
        for (let i = 0; i < entity.children.length; i++) {
          const child = entity.children[i];
          if (!visited[child.code]) {
            stack.push(child);
          } else {
            this.cycles.push(child);
          }
        }
      }
    }

    return this.cycles;
  }

  public isValid(): boolean {
    return !!this.detectCycles();
  }

  public getData() {
    return this.data;
  }

  public getGraph() {
    return this.graph;
  }
}

export default DataParser;
