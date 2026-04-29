export interface TourCtx {
  demandId: string | null;
  contractId: string | null;
}

export interface TourStep {
  id: string;
  title: string;
  body: string;
  path?: string | ((ctx: TourCtx) => string);
  click?: string | ((ctx: TourCtx) => string);
  fill?: { selector: string; value: string }[];
  capture?: "demandId" | "contractId";
  duration: number;
}
