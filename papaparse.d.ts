declare module "papaparse" {
  export type ParseError = {
    type: string;
    code: string;
    message: string;
    row?: number;
  };

  export type ParseMeta = {
    fields?: string[];
  };

  export type ParseResult<T> = {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  };

  export type ParseConfig<T> = {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    transformHeader?: (header: string, index: number) => string;
  };

  export function parse<T>(input: string, config?: ParseConfig<T>): ParseResult<T>;

  const Papa: {
    parse: typeof parse;
  };

  export default Papa;
}
