
import React, { useState, useMemo } from 'react';
import { useTextureStore } from '../../store';
import { renderers } from '../renderers';
import { PlusIcon } from '../shared/icons';
import PropertyTrackLane from './PropertyTrackLane';
import type { ControlSettings } from '../../types';

const PropertySequencer: React.FC = () => {
    const { project, activeSequenceIndex } = useTextureStore(state => ({
        project: state.project,
        activeSequenceIndex: state.activeSequenceIndex,
    }));
    const { addPropertyTrack } = useTextureStore.getState();

    const [selectedProperty, setSelectedProperty] = useState<string>('');

    const activeSequence = project?.sequences[activeSequenceIndex];
    const propertyTracks = activeSequence?.sequencer.propertyTracks || [];
    const usedProperties = useMemo(() => new Set(propertyTracks.map(t => t.property)), [propertyTracks]);

    const allAnimatableProps = useMemo(() => {
        // FIX: Use `keyof ControlSettings` for `id` to maintain type safety.
        const props: { id: keyof ControlSettings; label: string; category: string }[] = [];
        const addedProps = new Set<keyof ControlSettings>();

        Object.values(renderers).forEach(renderer => {
            renderer.controlSchema.forEach(section => {
                section.controls.forEach(control => {
                    if (control.type === 'slider' && !addedProps.has(control.id)) {
                        props.push({ 
                            id: control.id, 
                            label: control.label,
                            category: section.title 
                        });
                        addedProps.add(control.id);
                    }
                });
            });
        });
        
        return props.sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category);
            if (categoryCompare !== 0) return categoryCompare;
            return a.label.localeCompare(b.label);
        });
    }, []);

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
            <div className="flex items-center space-x-2 p-3 bg-gray-900/50 rounded-lg">
                <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg p-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                    <option value="" disabled>Seleccione una propiedad...</option>
                    {allAnimatableProps.map(prop => (
                        <option 
                            key={prop.id} 
                            value={prop.id} 
                            disabled={usedProperties.has(prop.id)}
                            className={usedProperties.has(prop.id) ? 'text-gray-500' : ''}
                        >
                            {prop.category} &gt; {prop.label}
                        </option>
                    ))}
                </select>
                <button 
                    onClick={handleAddTrack}
                    disabled={!selectedProperty}
                    className="flex-shrink-0 flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    <PlusIcon className="w-5 h-5"/>
                    <span>Añadir Pista</span>
                </button>
            </div>
            
            <div className="space-y-3">
                {propertyTracks.length === 0 ? (
                     <div className="text-center py-4 text-gray-500 text-sm">
                        Añade una pista para empezar a automatizar una propiedad.
                    </div>
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
