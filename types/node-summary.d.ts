// types/node-summary.d.ts

declare module 'node-summary' {
    export function summarize(
      title: string,
      content: string,
      callback: (err: any, summary: string) => void
    ): void;
  }
  