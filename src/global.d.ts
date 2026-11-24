export {};

declare global {
  interface Window {
    __dsa?: { routes: string[] };
  }
}
