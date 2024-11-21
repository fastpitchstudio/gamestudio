import { Player } from '@/types/player';

export const getPlayerInitials = (player: Player): string => {
  const firstInitial = player.first_name?.[0] || '';
  const lastInitial = player.last_name?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};
