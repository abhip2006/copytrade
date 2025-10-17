/**
 * Type declarations for @mathieuc/tradingview
 * Package doesn't include TypeScript definitions
 */

declare module '@mathieuc/tradingview' {
  export class Client {
    constructor();
    getQuote(symbol: string): Promise<any>;
    searchSymbol(query: string, exchange?: string): Promise<any[]>;
    getChart(options: { symbol: string; interval: string; range: number }): Promise<any>;
    getIndicators(symbol: string, indicators: string[]): Promise<any>;
    subscribeQuote(symbol: string, callback: (quote: any) => void): any;
  }
}
