export interface LineupSlot {
    id: string;
    playerId: string;
    position: Position | null;
    battingOrder?: number;
}