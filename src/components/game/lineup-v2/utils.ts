import { Player } from '@/types/player';

export const getPlayerInitials = (player: Player): string => {
  const firstInitial = player.firstName?.[0] || '';
  const lastInitial = player.lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};
