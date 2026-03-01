import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { setIsSequencerPlayingMock, setSequencerStepsMock, useTextureStoreMock } = vi.hoisted(() => {
  const setIsSequencerPlayingMock = vi.fn();
  const setSequencerStepsMock = vi.fn();

  const storeState: any = {
    project: {
      globalSettings: { isSequencerPlaying: false },
      sequences: [
        {
          id: 'seq-1',
          name: 'Main',
          interpolationSpeed: 2,
          activeRenderer: 'scales',
          activePatterns: [{ id: 'p-1', name: 'Pattern 1', settings: {} }],
          rendererSequencerStates: {
            scales: {
              steps: Array(8).fill(null),
              bpm: 120,
              numSteps: 8,
              propertyTracks: [],
            },
          },
        },
      ],
    },
    activeSequenceIndex: 0,
    sequencerCurrentStep: 0,
  };

  const useTextureStoreMock = vi.fn((selector: (state: any) => unknown) => selector(storeState));
  (useTextureStoreMock as any).getState = () => ({
    setIsSequencerPlaying: setIsSequencerPlayingMock,
    setSequencerBpm: vi.fn(),
    setSequencerSteps: setSequencerStepsMock,
    setActiveSequenceIndex: vi.fn(),
    updateActiveSequence: vi.fn(),
    setSequencerNumSteps: vi.fn(),
    saveNewSequence: vi.fn(),
    deleteSequence: vi.fn(),
    renameSequence: vi.fn(),
  });

  return { setIsSequencerPlayingMock, setSequencerStepsMock, useTextureStoreMock };
});

vi.mock('../../store', () => ({
  useTextureStore: useTextureStoreMock,
}));

vi.mock('../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../ui/icons', () => ({
  PlayIcon: () => <span>play</span>,
  StopIcon: () => <span>stop</span>,
  PlusIcon: () => <span>+</span>,
  TrashIcon: () => <span>trash</span>,
  SettingsIcon: () => <span>settings</span>,
}));

vi.mock('../ui', () => ({
  Button: ({ children, onClick, disabled, 'aria-label': ariaLabel, title }: any) => (
    <button aria-label={ariaLabel} title={title} onClick={onClick} disabled={disabled}>{children}</button>
  ),
  CollapsibleSection: ({ children }: any) => <div>{children}</div>,
  EmptyState: ({ heading, description }: any) => <div><h3>{heading}</h3><p>{description}</p></div>,
  Input: ({ onChange, onKeyDown, value, placeholder, id }: any) => (
    <input id={id} value={value} placeholder={placeholder} onChange={onChange} onKeyDown={onKeyDown} />
  ),
  Select: ({ children, value, onChange, id }: any) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
  ),
  SequencerCell: ({ onClick, active }: any) => <button data-active={active} onClick={onClick}>cell</button>,
  SliderInput: ({ label, value, onChange }: any) => (
    <label>{label}<input type="range" value={value} onChange={onChange} /></label>
  ),
}));

vi.mock('./PropertySequencer', () => ({
  default: () => <div data-testid="property-sequencer" />,
}));

import Sequencer from './Sequencer';

describe('Sequencer', () => {
  beforeEach(() => {
    setIsSequencerPlayingMock.mockClear();
    setSequencerStepsMock.mockClear();
  });

  it('toggles play state when transport button is clicked', () => {
    render(<Sequencer />);

    fireEvent.click(screen.getByRole('button', { name: 'sequencer.play' }));

    expect(setIsSequencerPlayingMock).toHaveBeenCalledWith(true);
  });

  it('toggles pattern assignment in a sequencer step when clicking a cell', () => {
    render(<Sequencer />);

    fireEvent.click(screen.getAllByRole('button').find((btn) => btn.textContent === 'cell')!);

    expect(setSequencerStepsMock).toHaveBeenCalled();
  });
});
