export interface Locale {
  format: string;
  symbols: {
    colon: string;
    comma: string;
    semicolon: string;
    slash: string;
    backslash: string;
    brackets: {
      round: string;
      square: string;
      curly: string;
      angle: string;
    };
    period: string;
    quotes: {
      single: string;
      double: string;
      grave: string;
    };
    space: string;
    ampersand: string;
    asterisk: string;
    at: string;
    equals: string;
    hash: string;
    percent: string;
    plus: string;
    minus: string;
    dash: string;
    hyphen: string;
    tilde: string;
    underscore: string;
    bar: string;
  };
  types: {
    key: string;
    value: string;
    number: string;
    string: string;
    primitive: string;
    boolean: string;
    character: string;
    integer: string;
    array: string;
    float: string;
  };
  invalidToken: {
    tokenSequence: {
      prohibited: string;
      permitted: string;
    };
    termSequence: {
      prohibited: string;
      permitted: string;
    };
    double: string;
    useInstead: string;
    unexpected: string;
  };
  brace: {
    curly: {
      missingOpen: string;
      missingClose: string;
      cannotWrap: string;
    };
    square: {
      missingOpen: string;
      missingClose: string;
      cannotWrap: string;
    }
  };
  string: {
    missingOpen: string;
    missingClose: string;
    mustBeWrappedByQuotes: string;
    nonAlphanumeric: string;
    unexpectedKey: string;
  };
  key: {
    numberAndLetterMissingQuotes: string;
    spaceMissingQuotes: string;
    unexpectedString: string;
  };
  noTrailingOrLeadingComma: string;
}

export enum TokenType {
  background = 'background',
  background_warning = 'background_warning',
  string = 'string',
  number = 'number',
  colon = 'colon',
  keys_whiteSpace = 'keys_whiteSpace',
  primitive = 'primitive',
  error = 'error',
  key = 'key',
  symbol = 'symbol',
  delimiter = 'delimiter',
  space = 'space',
  proto = 'proto'
}

type TokenColors = {
  [key in TokenType]?: string;
}

export interface Colors extends TokenColors {
  default?: string;
  keys?: string;
}

export interface JSONInputError {
  reason?: string;
  line?: number;
  theme?: string;
  token?: number;
}

export interface Style {
  outerBox?: unknown;
  container?: unknown;
  warningBox?: unknown;
  errorMessage?: unknown;
  body?: unknown;
  labelColumn?: unknown;
  labels?: unknown;
  contentBox?: unknown;
}

export interface JSONInputProps {
  locale: Locale;
  id?: string;
  placeholder?: object;
  reset?: boolean;
  viewOnly?: boolean;
  onChange?: any;
  onBlur?: any;
  confirmGood?: boolean;
  height?: string;
  width?: string;
  onKeyPressUpdate?: boolean;
  waitAfterKeyPress?: number;
  modifyErrorText?: ((errorReason: string) => string) | undefined;
  error?: JSONInputError;
  colors?: Colors;
  style?: Style;
  theme?: string;
}

export interface JSONInputState {
  prevPlaceholder:string,
  markupText:string,
  plainText:string,
  json:string,
  jsObject?: string,
  lines           : number,
  error           : boolean
}

export interface Token {
  type: TokenType;
  string: string;
}
