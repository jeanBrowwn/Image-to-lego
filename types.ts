export interface LegoPart {
  pieceId: string;
  pieceName: string;
  color: string;
  quantity: number;
  estimatedPrice: number;
}

export type Availability = 'Available' | 'Rare' | 'Check Alternatives';

export interface ValidatedLegoPart extends LegoPart {
  realPrice: number;
  availability: Availability;
  brickLinkUrl: string;
  isAlternative?: boolean;
  notes?: string;
}

export type LegoBuildSize = 'Micro' | 'Medium' | 'Large';

export interface LegoBlueprint {
  title: string;
  legoImageData: string; // base64 string
  partsList: LegoPart[]; // from AI
  totalPieces: number; // from AI
  estimatedCost: number; // from AI
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  buildTime: string;
  description: string;
  size: LegoBuildSize;
  validatedParts?: ValidatedLegoPart[];
  realTotalCost?: number;
}