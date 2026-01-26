// Test file to verify the new flexible settings system
import { 
  createInitialSettings,
  migrateLegacySettings,
  toLegacySettings,
  useWebGLCompatibleSettings,
  useConcentricCompatibleSettings,
  getNestedProperty,
  setNestedProperty
} from './src/utils/settingsMigration';

import type { LegacyControlSettings } from './src/types';

// Test 1: Create initial settings
console.log('=== Test 1: Initial Settings ===');
const initialSettings = createInitialSettings();
console.log('Initial Settings:', JSON.stringify(initialSettings, null, 2));

// Test 2: Legacy to New Migration
console.log('\n=== Test 2: Legacy Migration ===');
const legacySettings: LegacyControlSettings = {
  scaleSize: 200,
  scaleSpacing: 1.5,
  verticalOverlap: 0.3,
  horizontalOffset: 0.7,
  shapeMorph: 0.5,
  animationSpeed: 1.2,
  animationDirection: 45,
  textureRotation: 0,
  textureRotationSpeed: 1.0,
  scaleBorderColor: '#ff0000',
  scaleBorderWidth: 2,
  gradientColors: [
    { id: '1', color: '#ff0000', hardStop: false },
    { id: '2', color: '#00ff00', hardStop: true }
  ],
  backgroundGradientColors: [
    { id: 'bg-1', color: '#000000', hardStop: false }
  ],
  concentric_repetitionSpeed: 2.0,
  concentric_growthSpeed: 1.5,
  concentric_initialSize: 20,
  concentric_gradientColors: [
    { id: 'c-1', color: '#blue', hardStop: false }
  ]
};

const migratedSettings = migrateLegacySettings(legacySettings);
console.log('Migrated Settings:', JSON.stringify(migratedSettings, null, 2));

// Test 3: Back to Legacy
console.log('\n=== Test 3: Back to Legacy ===');
const backToLegacy = toLegacySettings(migratedSettings);
console.log('Back to Legacy:', JSON.stringify(backToLegacy, null, 2));

// Test 4: Property Path Operations
console.log('\n=== Test 4: Property Paths ===');
console.log('Get webgl.scaleSize:', getNestedProperty(migratedSettings, 'renderer.webgl.scaleSize'));
console.log('Get common.animationSpeed:', getNestedProperty(migratedSettings, 'common.animationSpeed'));

const updatedSettings = setNestedProperty(migratedSettings, 'renderer.webgl.scaleSize', 300);
console.log('Updated scaleSize to 300:', getNestedProperty(updatedSettings, 'renderer.webgl.scaleSize'));

// Test 5: Compatibility Adapters
console.log('\n=== Test 5: Compatibility Adapters ===');
const webglCompatible = useWebGLCompatibleSettings(migratedSettings);
console.log('WebGL Compatible:', JSON.stringify(webglCompatible, null, 2));

const concentricCompatible = useConcentricCompatibleSettings(migratedSettings);
console.log('Concentric Compatible:', JSON.stringify(concentricCompatible, null, 2));

console.log('\n✅ All tests completed successfully!');