export interface TranslationKeys {
  // Common
  'common.loading': string
  'common.error': string
  'common.success': string
  'common.cancel': string
  'common.save': string
  'common.delete': string
  'common.close': string
  'common.instant': string
  
  // Header
  'header.renderer': string
  'header.viewport': string
  'header.midi': string
  'header.fullscreen': string
  'header.settings': string
  'header.sequencer': string
  
  // Sequencer
  'sequencer.play': string
  'sequencer.stop': string
  'sequencer.bpm': string
  'sequencer.steps': string
  'sequencer.patterns': string
  'sequencer.addPattern': string
  'sequencer.saveCurrentPattern': string
  'sequencer.loadPattern': string
  'sequencer.deletePattern': string
  'sequencer.interpolationSpeed': string
  'sequencer.propertySequencer': string
  'sequencer.addTrack': string
  
  // Controls
  'controls.scaleSize': string
  'controls.animationSpeed': string
  'controls.borderSize': string
  'controls.borderColor': string
  'controls.scaleGradient': string
  'controls.backgroundGradient': string
  'controls.rotationSpeed': string
  'controls.opacity': string
  'controls.blendMode': string
  'controls.hexRadius': string
  'controls.concentricLayers': string
  'controls.horizontalSpacing': string
  'controls.verticalSpacing': string
  'controls.horizontalOffset': string
  'controls.shapeForm': string
  'controls.animationDirection': string
  
  // MIDI
  'midi.learn': string
  'midi.learning': string
  'midi.mapped': string
  'midi.console': string
  'midi.connectDevice': string
  'midi.noDevices': string
  'midi.clearMappings': string
  'midi.configuration': string
  'midi.connectionError': string
  'midi.retry': string
  'midi.inputDevice': string
  'midi.notConnected': string
  'midi.connect': string
  'midi.waiting': string
  
  // Project
  'project.new': string
  'project.load': string
  'project.save': string
  'project.export': string
  'project.import': string
  'project.name': string
  'project.defaultName': string
  'project.globalConfiguration': string
  'project.dataManagement': string
  'project.dataManagementDescription': string
  'project.renderEngine': string
  'project.renderEngineDescription': string
  
  // Patterns
  'patterns.title': string
  'patterns.saveAsNew': string
  'patterns.overwrite': string
  'patterns.overwriteTooltip': string
  'patterns.overwriteSelectedTooltip': string
  'patterns.savedMemories': string
  'patterns.noPatterns': string
  'patterns.assignMidi': string
  'patterns.clearMidi': string
  
  // UI Actions
  'ui.clear': string
  'ui.save': string
  'ui.cancel': string
  'ui.duplicate': string
  'ui.resetToDefault': string
  'ui.enterFullscreen': string
  'ui.exitFullscreen': string
  'ui.openControls': string
  'ui.closeControls': string
  'ui.openSequencer': string
  'ui.closeSequencer': string
  'ui.openMidiConsole': string
  'ui.clearConsole': string
  'ui.closeConsole': string
  
  // Sequences
  'sequence.label': string
  'sequence.new': string
  'sequence.duplicate': string
  'sequence.delete': string
  'sequence.cantDeleteLast': string
  'sequence.newName': string
  'sequence.confirmDelete': string
  
  // Shape values
  'shape.circle': string
  'shape.diamond': string
  'shape.star': string
  'shape.circleToDiamond': string
  'shape.diamondToStar': string
  'shape.stopped': string
  
  // Renderers
  'renderer.webgl': string
  'renderer.canvas2d': string
  'renderer.concentric': string
  
  // Sections
  'section.scale': string
  'section.animation': string
  'section.appearance': string
  'section.background': string
  'section.border': string
  'section.concentric': string
  
  // Viewport
  'viewport.default': string
  'viewport.desktop': string
  'viewport.mobile': string
  
  // Debug
  'debug.overlay': string
  'debug.fps': string
  'debug.ticks': string
  'debug.step': string
  'debug.animations': string
  'debug.export': string
  'debug.openConsole': string
  'debug.rafCalls': string
  'debug.settingsUpdates': string
  'debug.patternLoads': string
  'debug.animationFrame': string
  'debug.transitionProgress': string
  'debug.console': string
  'debug.metrics': string
  'debug.sequencerTicks': string
  'debug.currentStep': string
  'debug.animationActive': string
  'debug.activeAnimations': string
  'debug.interpolationSpeed': string
  'debug.settingsHash': string
  'debug.steps': string
  'debug.clearLogs': string
  'debug.exportData': string
  'debug.eventLog': string
  'debug.noEvents': string
  
  // Validation/Errors
  'error.loadProject': string
  'error.saveProject': string
  'error.midiAccess': string
  'error.invalidProject': string
  'error.resetConfirmation': string
}

export type LocaleCode = 'en' | 'es'

export interface TranslationParams {
  [key: string]: string | number
}