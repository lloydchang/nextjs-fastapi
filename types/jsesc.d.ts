// types/jsesc.d.ts

declare module 'jsesc' {
    interface Options {
      /**
       * Encode all non-ASCII characters as Unicode escape sequences
       */
      json?: boolean;
      /**
       * Indent string used for multi-line output
       */
      indent?: string;
      /**
       * Whether to wrap the output in quotes
       */
      quotes?: boolean;
      /**
       * Escape characters as ASCII
       */
      escapeEverything?: boolean;
      /**
       * Use hexadecimal instead of Unicode for escaped characters
       */
      hexadecimal?: boolean;
      /**
       * Preserve characters as-is
       */
      minimal?: boolean;
      /**
       * Allow all printable characters
       */
      compact?: boolean;
    }
  
    function jsesc(input: any, options?: Options): string;
  
    export default jsesc;
  }
  