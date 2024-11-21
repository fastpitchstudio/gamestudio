export interface LineupSlot {
    id: string;
    order: number;
    position: string | null;
    player?: {
      id: string;
      number: string;
      first_name: string;
      last_name: string;
      preferred_positions?: string[];
    };
  }