
import React, { useEffect, useMemo, useState } from 'react';
import { useTextureStore } from '../../store';
import { PlusIcon } from '../ui/icons';
import { Button, EmptyState, Select } from '../ui';
import PropertyTrackLane from './PropertyTrackLane';
import type { ControlSettings } from '../../types';

const PropertySequencer: React.FC = () => {
    const { project, activeSequenceIndex, rendererAnimatableProperties } = useTextureStore(state => ({
        project: state.project,
        activeSequenceIndex: state.activeSequenceIndex,
        rendererAnimatableProperties: state.rendererAnimatableProperties,
    }));
    const { addPropertyTrack, hydrateRendererAnimatableProperties } = useTextureStore.getState();

    const [selectedProperty, setSelectedProperty] = useState<string>('');

    const activeSequence = project?.sequences[activeSequenceIndex];
    const sequencerState = activeSequence?.rendererSequencerStates[activeSequence.activeRenderer];
    const propertyTracks = sequencerState?.propertyTracks || [];
    const usedProperties = useMemo(() => new Set(propertyTracks.map(t => t.property)), [propertyTracks]);

    const selectedRendererId = activeSequence?.activeRenderer || 'webgl';

    useEffect(() => {
        void hydrateRendererAnimatableProperties(selectedRendererId);
    }, [selectedRendererId]);

    const allAnimatableProps = useMemo(() => {
        return rendererAnimatableProperties[selectedRendererId] || [];
    }, [rendererAnimatableProperties, selectedRendererId]);

    const handleAddTrack = () => {
        if (selectedProperty) {
            // FIX: Asserting the type is correct here as `select` value is always a string.
            addPropertyTrack(selectedProperty as keyof ControlSettings);
            setSelectedProperty(''); // Reset selector to placeholder
        }
    };
    
    if (!activeSequence) return null;

    return (
        <div className="space-y-4">
            {/* Add track control - responsive */}
            <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-900/50 rounded-lg">
                <Select
                    value={selectedProperty}
                    onChange={(value) => setSelectedProperty(String(value))}
                    className="flex-1"
                    placeholder="Seleccione una propiedad..."
                >
                    {allAnimatableProps.map(prop => (
                        <option 
                            key={prop.id} 
                            value={prop.id} 
                            disabled={usedProperties.has(prop.id)}
                            className={usedProperties.has(prop.id) ? 'text-gray-500' : ''}
                        >
                            {prop.label} ({prop.category})
                        </option>
                    ))}
                </Select>
                <Button 
                    variant="primary"
                    onClick={handleAddTrack}
                    disabled={!selectedProperty}
                    icon={<PlusIcon className="w-5 h-5"/>}
                >
                    <span className="hidden sm:inline">Añadir Pista</span>
                    <span className="sm:hidden">Añadir</span>
                </Button>
            </div>
            
            {/* Track lanes */}
            <div className="space-y-3">
                {propertyTracks.length === 0 ? (
                    <EmptyState
                        icon="🎹"
                        heading="Property Sequencer"
                        description="Añade una pista para empezar a automatizar propiedades."
                        className="py-8 text-gray-500"
                    />
                ) : (
                    propertyTracks.map(track => (
                        <PropertyTrackLane key={track.id} track={track} />
                    ))
                )}
            </div>
        </div>
    );
};

export default PropertySequencer;
