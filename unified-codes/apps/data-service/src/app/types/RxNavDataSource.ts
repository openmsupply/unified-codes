import { RESTDataSource } from 'apollo-datasource-rest';

import { IDrugInteraction } from '@unified-codes/data';

// RxCui is stringified numerical ID.
// Note: ts proposal for regex-validated types: https://github.com/Microsoft/TypeScript/issues/6579.
export type RxNavCui = string;

// RxNav sources interaction information from DrugBank and ONCHigh.
export type RxNavSource = 'DrugBank' | 'ONCHigh';

// See https://www.nlm.nih.gov/research/umls/rxnorm/docs/appendix5.html for details.
export type RxNavTermType =
  | 'IN'
  | 'PIN'
  | 'MIN'
  | 'SCDC'
  | 'SCDF'
  | 'SCDG'
  | 'SCD'
  | 'GPCK'
  | 'BN'
  | 'SBDC'
  | 'SBDF'
  | 'SBDG'
  | 'SBD'
  | 'BPCK'
  | 'PSN'
  | 'SY'
  | 'TMSY'
  | 'DF'
  | 'ET'
  | 'DFG';

// DrugBank contains no severity levels for interactions. ONCHigh interactions are all high-priority severity.
export type RxNavInteractionSeverity = 'N/A' | 'high';

export interface IRxNavMinConceptItem {
  rxcui: RxNavCui;
  name: string;
  tty: RxNavTermType;
}

export interface IRxNavSourceConceptItem {
  id: string;
  name: string;
  url: string;
}

export interface IRxNavInteractionConceptItem {
  minConceptItem: IRxNavMinConceptItem;
  sourceConceptItem: IRxNavSourceConceptItem;
}

// First item represents the query item, second represents the interacting item.
export type IRxNavInteractionConcept = [IRxNavInteractionConceptItem, IRxNavInteractionConceptItem];

export interface IRxNavInteractionPair {
  interactionConcept: IRxNavInteractionConcept;
  severity: RxNavInteractionSeverity;
  description: string;
}

export interface IRxNavInteractionType {
  comment: string;
  minConceptItem: IRxNavMinConceptItem;
  interactionPair: IRxNavInteractionPair[];
}

export interface IRxNavInteractionTypeGroup {
  sourceDisclaimer: string;
  sourceName: string;
  interactionType: IRxNavInteractionType[];
}

export interface IRxNavInteractionInput {
  sources: RxNavSource[];
  rxcui: RxNavCui;
  tty: RxNavTermType;
}

export interface IRxNavInteractionResponseBody {
  nlmDisclaimer: string;
  userInput: IRxNavInteractionInput;
  interactionTypeGroup: IRxNavInteractionTypeGroup[];
}

export class RxNavDataSource extends RESTDataSource {
  static paths: { [key: string]: string } = {
    interactions: '/interaction/interaction.json',
  };

  constructor() {
    super();
    this.baseURL = `${process.env.NX_RXNAV_SERVICE_URL}/${process.env.NX_RXNAV_SERVICE_REST}`;
  }

  async getInteractions(rxcui: string): Promise<IDrugInteraction[]> {
    const body: IRxNavInteractionResponseBody = await this.get(RxNavDataSource.paths.interactions, {
      rxcui,
    });
    const interactions = body.interactionTypeGroup.flatMap(
      (interactionTypeGroup: IRxNavInteractionTypeGroup) => {
        const { sourceName: source } = interactionTypeGroup;
        return interactionTypeGroup.interactionType.flatMap(
          (interactionType: IRxNavInteractionType) => {
            return interactionType.interactionPair.flatMap(
              (interactionPair: IRxNavInteractionPair) => {
                const { interactionConcept, description, severity } = interactionPair;
                const [_, interactionConceptItem] = interactionConcept;
                const { minConceptItem, sourceConceptItem } = interactionConceptItem;
                const { rxcui } = minConceptItem;
                const { name } = sourceConceptItem;
                const interaction: IDrugInteraction = {
                  source,
                  name,
                  rxcui,
                  description,
                  severity,
                };
                return interaction;
              }
            );
          }
        );
      }
    );
    return interactions;
  }
}

export default RxNavDataSource;
