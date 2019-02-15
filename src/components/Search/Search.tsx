import Downshift, {
  ControllerStateAndHelpers,
  DownshiftState,
  DownshiftProps,
  StateChangeOptions
} from "downshift";
import * as React from "react";
import { PipelineConsumer } from "../context/pipeline";
import { SearchFn, PaginateFn } from "../context/pipeline/context";
import { Result } from "@sajari/sdk-js";

import { isNotEmptyArray, isNotEmptyString, mapToObject } from "./utils";

export type SearchStateAndHelpers = ControllerStateAndHelpers<any> &
  PipelineProps;

export interface PipelineProps {
  search: SearchFn;
  instantSearch: SearchFn;
  paginate: PaginateFn;
  suggestions: string[];
  results: Result[];
  completion: string;
  summary: SummaryInterface | undefined;
}

export interface QueryValuesInterface {
  filter: string;
  q: string;
  page: string;
}

export interface ValuesInterface {
  q?: string;
  "q.original"?: string;
  "q.suggestions"?: string;
}

export interface ResponseInterface {
  reads: number;
  totalResults: number;
  time: number;
}

export interface SummaryInterface {
  queryValues: QueryValuesInterface;
  values: ValuesInterface;
  response: ResponseInterface;
}

export interface StateChangeOptions<Item> extends StateChangeOptions<Item> {}

export interface SearchState<Item> extends DownshiftState<Item> {}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface SearchProps<Item>
  extends Omit<DownshiftProps<Item>, "onChange" | "stateReducer" | "children"> {
  children: (args: SearchStateAndHelpers) => JSX.Element;
  stateReducer?: (
    state: SearchState<Item>,
    changes: StateChangeOptions<Item>,
    pipeline: PipelineProps
  ) => Partial<StateChangeOptions<Item>>;
  onChange?: (
    selectedItem: Item,
    stateAndHelper: SearchState<Item> & PipelineProps
  ) => void;
}

export class Search extends React.PureComponent<SearchProps<any>, {}> {
  public static stateChangeTypes = { ...Downshift.stateChangeTypes };
  public state = {};

  private stateReducer = (pipeline: PipelineProps) => (
    state: DownshiftState<any>,
    changes: StateChangeOptions<any>
  ) => {
    if (typeof this.props.stateReducer === "function") {
      return this.props.stateReducer(state, changes, pipeline);
    }

    return changes;
  };

  private onChange = (pipeline: PipelineProps) => (
    selectedItem: any,
    stateAndHelper: DownshiftState<any>
  ) => {
    if (typeof this.props.onChange !== "function") {
      return undefined;
    }
    return this.props.onChange(selectedItem, {
      ...stateAndHelper,
      ...pipeline
    });
  };

  public render() {
    const { onChange, stateReducer, children, ...rest } = this.props;

    if (typeof children !== "function") {
      // istanbul ignore next
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `Warning: Must specify either a render prop, a render function as children, or a component prop to Search`
        );
      }
      return null; // warning will alert developer to their mistake
    }

    return (
      <PipelineConsumer>
        {pipelines => {
          const suggestions = isNotEmptyArray(
            pipelines.search.suggestions,
            pipelines.instant.suggestions
          );

          const completion = isNotEmptyString(
            pipelines.search.completion,
            pipelines.instant.completion
          );

          pipelines.instant;

          const results = isNotEmptyArray(
            (pipelines.search.response &&
              pipelines.search.response.getResults()) ||
              [],
            (pipelines.instant.response &&
              pipelines.instant.response.getResults()) ||
              []
          );

          const response =
            pipelines.search.response || pipelines.instant.response;
          let summary: SummaryInterface | undefined;
          if (response) {
            summary = {
              queryValues: (mapToObject(
                response.getQueryValues()
              ) as unknown) as QueryValuesInterface,
              values: mapToObject(response.getValues()) as ValuesInterface,
              response: (mapToObject(response.getResponse() as
                | Map<string, any>
                | undefined) as unknown) as ResponseInterface
            };
          }

          const paginate = pipelines.paginate;
          const instantSearch = pipelines.instant.search;
          const search = pipelines.search.search;

          const pipeline = {
            paginate,
            instantSearch,
            search,
            results,
            suggestions,
            completion,
            summary
          };

          return (
            <Downshift
              stateReducer={this.stateReducer(pipeline)}
              onChange={this.onChange(pipeline)}
              {...rest}
            >
              {downshift =>
                children({
                  ...downshift,
                  ...pipeline
                })
              }
            </Downshift>
          );
        }}
      </PipelineConsumer>
    );
  }
}

export default Search;
