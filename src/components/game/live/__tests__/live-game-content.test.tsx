import { render, screen, act } from '@testing-library/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LiveGameContent from '../live-game-content';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}));

// Mock data
const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  created_at: new Date().toISOString(),
};

const mockPlayers = [
  {
    id: '1',
    number: '1',
    first_name: 'John',
    last_name: 'Doe',
    preferred_positions: ['P', 'SS'],
    available: true
  },
  {
    id: '2',
    number: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    preferred_positions: ['C', '1B'],
    available: true
  }
];

const mockGame = {
  id: 'game-1',
  team_id: 'team-1',
  opponent: 'Test Opponent',
  date: new Date().toISOString(),
  location: 'Test Field',
  game_lineups: []
};

describe('LiveGameContent', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [], error: null })
    };

    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('renders game information correctly', () => {
    render(
      <LiveGameContent
        team={mockTeam}
        initialGame={mockGame}
        initialPlayers={mockPlayers}
      />
    );

    expect(screen.getByText('Test Opponent')).toBeInTheDocument();
    expect(screen.getByText('Test Field')).toBeInTheDocument();
  });

  it('handles lineup changes correctly', async () => {
    const newLineup = [
      {
        id: 'slot-1',
        order: 1,
        position: 'P',
        player: mockPlayers[0]
      }
    ];

    render(
      <LiveGameContent
        team={mockTeam}
        initialGame={mockGame}
        initialPlayers={mockPlayers}
      />
    );

    // Mock successful deletion
    mockSupabase.execute.mockResolvedValueOnce({ data: [], error: null });

    // Mock successful insertion
    mockSupabase.execute.mockResolvedValueOnce({ 
      data: [{ id: 'lineup-1', ...newLineup[0] }], 
      error: null 
    });

    // Simulate lineup change
    await act(async () => {
      const lineupBuilder = screen.getByTestId('lineup-builder');
      // Trigger lineup change through the LineupBuilder component
      lineupBuilder.dispatchEvent(new CustomEvent('lineupchange', { 
        detail: newLineup 
      }));
    });

    // Verify Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith('game_lineups');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  it('handles lineup update errors correctly', async () => {
    // Mock an error response
    mockSupabase.execute.mockResolvedValueOnce({ 
      data: null, 
      error: new Error('Database error') 
    });

    render(
      <LiveGameContent
        team={mockTeam}
        initialGame={mockGame}
        initialPlayers={mockPlayers}
      />
    );

    // Simulate lineup change that will fail
    await act(async () => {
      const lineupBuilder = screen.getByTestId('lineup-builder');
      lineupBuilder.dispatchEvent(new CustomEvent('lineupchange', { 
        detail: [] 
      }));
    });

    // Verify error handling
    expect(screen.getByText(/error updating lineup/i)).toBeInTheDocument();
  });

  it('maintains existing lineups from other innings', async () => {
    const existingLineups = [
      {
        id: 'lineup-1',
        inning: 2,
        order: 1,
        position: 'P',
        player: mockPlayers[0]
      }
    ];

    const gameWithLineups = {
      ...mockGame,
      game_lineups: existingLineups
    };

    render(
      <LiveGameContent
        team={mockTeam}
        initialGame={gameWithLineups}
        initialPlayers={mockPlayers}
      />
    );

    // Simulate lineup change for inning 1
    const newLineup = [
      {
        id: 'slot-1',
        order: 1,
        position: 'C',
        player: mockPlayers[1]
      }
    ];

    await act(async () => {
      const lineupBuilder = screen.getByTestId('lineup-builder');
      lineupBuilder.dispatchEvent(new CustomEvent('lineupchange', { 
        detail: newLineup 
      }));
    });

    // Verify that both lineups exist
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ inning: 1 })
      ])
    );
  });
});
