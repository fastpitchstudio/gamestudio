import { render, screen, fireEvent } from '@testing-library/react';

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
  DndContext: ({ children, onDragStart, onDragEnd }) => (
    <div data-testid="lineup-dnd-context" onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {children}
    </div>
  )
}));

// Helper function to simulate drag and drop
const simulateDragAndDrop = (sourceId: string, targetId: string) => {
  // Create drag start event
  const dragStartEvent = {
    active: { 
      id: sourceId, 
      data: { 
        current: { 
          type: sourceId.startsWith('roster-') ? 'player' : 'slot',
          player: sourceId.startsWith('roster-') 
            ? mockPlayers.find(p => p.id === sourceId.replace('roster-', ''))
            : undefined
        } 
      } 
    },
    over: null
  };

  // Create drag end event
  const dragEndEvent = {
    active: dragStartEvent.active,
    over: { 
      id: targetId, 
      data: { 
        current: { 
          type: 'slot'
        } 
      } 
    }
  };

  return {
    dragStartEvent,
    dragEndEvent
  };
};

describe('LineupBuilder Drag and Drop', () => {
  it('handles drag and drop between lineup slots', async () => {
    const handleLineupChange = jest.fn();
    render(
      <LineupBuilder 
        players={mockPlayers} 
        initialLineup={mockInitialLineup}
        onLineupChange={handleLineupChange}
      />
    );

    const dndContext = screen.getByTestId('lineup-dnd-context');
    const { dragStartEvent, dragEndEvent } = simulateDragAndDrop('slot-1', 'slot-2');

    // Simulate drag start
    fireEvent(dndContext, new CustomEvent('dragstart', { detail: dragStartEvent }));
    
    // Simulate drag end
    fireEvent(dndContext, new CustomEvent('dragend', { detail: dragEndEvent }));

    // Verify the lineup was updated correctly
    expect(handleLineupChange).toHaveBeenCalled();
    const newLineup = handleLineupChange.mock.calls[0][0];
    expect(newLineup[1].player?.id).toBe(mockPlayers[0].id);
  });

  it('shows drag overlay during drag', async () => {
    render(
      <LineupBuilder 
        players={mockPlayers} 
        initialLineup={mockInitialLineup}
      />
    );

    const dndContext = screen.getByTestId('lineup-dnd-context');
    const { dragStartEvent } = simulateDragAndDrop('slot-1', 'slot-2');

    // Simulate drag start
    fireEvent(dndContext, new CustomEvent('dragstart', { detail: dragStartEvent }));

    // Verify active player info is shown in overlay
    const overlay = screen.getByText(mockPlayers[0].first_name);
    expect(overlay).toBeInTheDocument();
  });

  it('handles player swapping correctly', async () => {
    const handleLineupChange = jest.fn();
    render(
      <LineupBuilder 
        players={mockPlayers} 
        initialLineup={mockInitialLineup}
        onLineupChange={handleLineupChange}
      />
    );

    const dndContext = screen.getByTestId('lineup-dnd-context');
    const { dragStartEvent, dragEndEvent } = simulateDragAndDrop('slot-1', 'slot-2');

    // Simulate drag start
    fireEvent(dndContext, new CustomEvent('dragstart', { detail: dragStartEvent }));
    
    // Simulate drag end
    fireEvent(dndContext, new CustomEvent('dragend', { detail: dragEndEvent }));

    // Verify the swap occurred
    expect(handleLineupChange).toHaveBeenCalled();
    const newLineup = handleLineupChange.mock.calls[0][0];
    expect(newLineup[0].player?.id).toBe(mockPlayers[1].id);
    expect(newLineup[1].player?.id).toBe(mockPlayers[0].id);
  });

  it('handles adding player from roster to empty slot', async () => {
    const handleLineupChange = jest.fn();
    render(
      <LineupBuilder 
        players={mockPlayers} 
        initialLineup={[]}
        onLineupChange={handleLineupChange}
      />
    );

    const dndContext = screen.getByTestId('lineup-dnd-context');
    const { dragStartEvent, dragEndEvent } = simulateDragAndDrop(
      'roster-1',
      'slot-1'
    );

    // Simulate drag start
    fireEvent(dndContext, new CustomEvent('dragstart', { detail: dragStartEvent }));
    
    // Simulate drag end
    fireEvent(dndContext, new CustomEvent('dragend', { detail: dragEndEvent }));

    // Verify the player was added
    expect(handleLineupChange).toHaveBeenCalled();
    const newLineup = handleLineupChange.mock.calls[0][0];
    expect(newLineup[0].player?.id).toBe(mockPlayers[0].id);
  });
});
