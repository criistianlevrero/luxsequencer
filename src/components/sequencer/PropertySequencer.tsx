
import React, { useState, useMemo } from 'react';
import { useTextureStore } from '../../store';
import { renderers } from '../renderers';
import { PlusIcon } from '../shared/icons';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
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
        // Get only properties from the selected renderer
        const props: { id: keyof ControlSettings; label: string; category: string }[] = [];
        const addedProps = new Set<keyof ControlSettings>();

        // Get the currently selected renderer
        const selectedRendererId = project?.globalSettings.renderer || 'webgl';
        const selectedRenderer = renderers[selectedRendererId];
        
        if (selectedRenderer) {
            // Handle both array and function controlSchema
            const controlSchema = typeof selectedRenderer.controlSchema === 'function' 
                ? selectedRenderer.controlSchema() 
                : selectedRenderer.controlSchema;
                
            controlSchema.forEach(section => {
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
        }
        
        return props.sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category);
            if (categoryCompare !== 0) return categoryCompare;
            return a.label.localeCompare(b.label);
        });
    }, [project?.globalSettings.renderer]);

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
                    onChange={(value) => setSelectedProperty(value)}
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
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <div className="mb-2">🎹</div>
                        <div>Añade una pista para empezar a automatizar propiedades.</div>
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
