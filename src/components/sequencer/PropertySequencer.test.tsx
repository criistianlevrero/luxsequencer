import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { addPropertyTrackMock, storeState, useTextureStoreMock } = vi.hoisted(() => {
  const addPropertyTrackMock = vi.fn();
  const hydrateRendererAnimatablePropertiesMock = vi.fn(async () => undefined);
  const storeState: any = {
    project: {
      globalSettings: {
        renderer: 'scales',
      },
      sequences: [
        {
          id: 'seq-1',
          activeRenderer: 'scales',
          rendererSequencerStates: {
            scales: {
              propertyTracks: [],
            },
          },
        },
      ],
    },
    activeSequenceIndex: 0,
    rendererAnimatableProperties: {
      scales: [
        {
          id: 'common.animationSpeed',
          label: 'Animation Speed',
          category: 'Common',
          min: 0,
          max: 3,
          step: 0.1,
        },
      ],
    },
  };

  const useTextureStoreMock = vi.fn((selector: (state: any) => unknown) => selector(storeState));
  (useTextureStoreMock as any).getState = () => ({
    addPropertyTrack: addPropertyTrackMock,
    hydrateRendererAnimatableProperties: hydrateRendererAnimatablePropertiesMock,
  });

  return { addPropertyTrackMock, storeState, useTextureStoreMock };
});

vi.mock('../../store', () => ({
  useTextureStore: useTextureStoreMock,
}));

vi.mock('../ui/icons', () => ({
  PlusIcon: () => <span>+</span>,
}));

vi.mock('../ui', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  EmptyState: ({ heading, description }: any) => (
    <div>
      <h3>{heading}</h3>
      <p>{description}</p>
    </div>
  ),
  Select: ({ children, value, onChange }: any) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
  ),
}));

vi.mock('./PropertyTrackLane', () => ({
  default: ({ track }: { track: { id: string } }) => <div data-testid={`track-${track.id}`} />,
}));

import PropertySequencer from './PropertySequencer';

describe('PropertySequencer', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    addPropertyTrackMock.mockClear();
    storeState.project.sequences[0].rendererSequencerStates.scales.propertyTracks = [];
  });

  it('shows empty state when no property tracks exist', () => {
    render(<PropertySequencer />);

    expect(screen.getByText('Property Sequencer')).toBeInTheDocument();
  });

  it('adds a property track when selecting and clicking add', () => {
    render(<PropertySequencer />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'common.animationSpeed' } });

    fireEvent.click(screen.getByRole('button', { name: /añadir|add/i }));

    expect(addPropertyTrackMock).toHaveBeenCalledWith('common.animationSpeed');
  });
});
