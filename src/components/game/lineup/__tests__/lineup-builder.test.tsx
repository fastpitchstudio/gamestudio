import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import LineupBuilder from '../lineup-builder';

// Mock data
const mockPlayers = [
  {
    id: '1',
    number: '1',
    first_name: 'John',
    last_name: 'Doe',
    preferred_positions: ['P', 'SS']
  },
  {
    id: '2',
    number: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    preferred_positions: ['C', '1B']
  }
];

const mockInitialLineup = [
  {
    id: 'slot-1',
    order: 1,
    position: 'P',
    player: mockPlayers[0]
  },
  {
    id: 'slot-2',
    order: 2,
    position: 'C',
    player: mockPlayers[1]
  }
];

// Mock DndKit's useSensor and useSensors
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>
}));

// Mock Radix UI Select component
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, onValueChange }) => (
    <div data-testid="select-root" onClick={() => onValueChange && onValueChange('SS')}>
      {children}
    </div>
  ),
  Trigger: ({ children }) => <div data-testid="select-trigger">{children}</div>,
  Value: ({ children }) => <span>{children}</span>,
  Portal: ({ children }) => <div data-testid="select-portal">{children}</div>,
  Content: ({ children }) => <div data-testid="select-content">{children}</div>,
  Viewport: ({ children }) => <div data-testid="select-viewport">{children}</div>,
  Item: ({ children, className }) => (
    <div data-testid="select-item" className={className}>
      {children}
    </div>
  ),
  ItemText: ({ children }) => <span>{children}</span>
}));

describe('LineupBuilder', () => {
  it('renders lineup slots and roster correctly', () => {
    render(
      <DndContext>
        <LineupBuilder 
          players={mockPlayers} 
          initialLineup={mockInitialLineup}
        />
      </DndContext>
    );

    // Check lineup slots
    const slots = screen.getAllByRole('button', { 'aria-roledescription': 'sortable' });
    expect(slots).toHaveLength(9); // Default 9 slots

    // Check roster players
    mockPlayers.forEach(player => {
      const playerElement = screen.getByText(`${player.first_name} ${player.last_name}`);
      expect(playerElement).toBeInTheDocument();
    });
  });

  it('allows removing players from lineup', async () => {
    const handleLineupChange = jest.fn();
    render(
      <DndContext>
        <LineupBuilder 
          players={mockPlayers} 
          initialLineup={mockInitialLineup}
          onLineupChange={handleLineupChange}
        />
      </DndContext>
    );

    // Find and click remove button for first player
    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('.lucide-trash2')
    );
    fireEvent.click(removeButtons[0]);

    // Verify lineup was updated
    await waitFor(() => {
      expect(handleLineupChange).toHaveBeenCalled();
      const newLineup = handleLineupChange.mock.calls[0][0];
      expect(newLineup[0].player).toBeNull();
    });
  });

  it('allows changing player positions', async () => {
    const handleLineupChange = jest.fn();
    render(
      <DndContext>
        <LineupBuilder 
          players={mockPlayers} 
          initialLineup={mockInitialLineup}
          onLineupChange={handleLineupChange}
        />
      </DndContext>
    );

    // Find and click position select
    const selectRoot = screen.getAllByTestId('select-root')[0];
    fireEvent.click(selectRoot);

    // Verify lineup was updated
    await waitFor(() => {
      expect(handleLineupChange).toHaveBeenCalled();
      const newLineup = handleLineupChange.mock.calls[0][0];
      expect(newLineup[0].position).toBe('SS');
    });
  });

  it('highlights preferred positions in position select', async () => {
    render(
      <DndContext>
        <LineupBuilder 
          players={mockPlayers} 
          initialLineup={mockInitialLineup}
        />
      </DndContext>
    );

    // Find and click position select
    const selectRoot = screen.getAllByTestId('select-root')[0];
    fireEvent.click(selectRoot);

    // Verify preferred positions are highlighted
    await waitFor(() => {
      const selectItems = screen.getAllByTestId('select-item');
      const preferredItems = selectItems.filter(item => 
        mockPlayers[0].preferred_positions.includes(item.textContent?.trim() || '')
      );
      preferredItems.forEach(item => {
        expect(item.className).toContain('font-bold');
      });
    });
  });

  it('shows empty slots when lineup is empty', () => {
    render(
      <DndContext>
        <LineupBuilder 
          players={mockPlayers} 
          initialLineup={[]}
        />
      </DndContext>
    );

    // Check that all slots show "Empty slot"
    const emptySlots = screen.getAllByText('Empty slot');
    expect(emptySlots).toHaveLength(9);
  });

  it('shows player numbers in lineup slots', () => {
    render(
      <DndContext>
        <LineupBuilder 
          players={mockPlayers} 
          initialLineup={mockInitialLineup}
        />
      </DndContext>
    );

    // Check player numbers are displayed
    mockInitialLineup.forEach(slot => {
      if (slot.player) {
        const number = screen.getByText(slot.player.number);
        expect(number).toBeInTheDocument();
      }
    });
  });

  it('disables position select for empty slots', () => {
    render(
      <DndContext>
        <LineupBuilder 
          players={mockPlayers} 
          initialLineup={[]}
        />
      </DndContext>
    );

    // Check that position selects are disabled for empty slots
    const selectTriggers = screen.getAllByTestId('select-trigger');
    selectTriggers.forEach(trigger => {
      expect(trigger.parentElement).toHaveAttribute('data-disabled', 'true');
    });
  });
});
