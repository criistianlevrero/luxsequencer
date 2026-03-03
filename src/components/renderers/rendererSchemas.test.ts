import { describe, expect, it } from 'vitest';
import { renderers } from './index';
import { webglRendererControlSpec } from './scales/scales-declarative-schema';
import { dvdScreensaverDeclarativeSchema } from './dvd-screensaver/dvd-screensaver-declarative-schema';
import { concentricDeclarativeSchema } from './concentric/concentric-declarative-schema';

const assertUniqueIds = (ids: string[]) => {
  const set = new Set(ids);
  expect(set.size).toBe(ids.length);
};

const validateStandardSliderConstraints = (control: any) => {
  if (control.type !== 'slider') return;

  const slider = control.constraints?.slider;
  expect(slider).toBeDefined();
  expect(typeof slider.min).toBe('number');
  expect(typeof slider.max).toBe('number');
  expect(typeof slider.step).toBe('number');
  expect(slider.min).toBeLessThan(slider.max);
};

const validateDeclarativeSliderConstraints = (control: any) => {
  if (control.type !== 'slider') return;

  expect(typeof control.min).toBe('number');
  expect(typeof control.max).toBe('number');
  expect(typeof control.step).toBe('number');
  expect(control.min).toBeLessThan(control.max);
};

describe('renderer declarative schemas', () => {
  it('renderer registry exposes renderer definitions with required contracts', () => {
    const ids = Object.keys(renderers);

    expect(ids.length).toBeGreaterThanOrEqual(3);
    ids.forEach((id) => {
      const renderer = renderers[id];
      expect(renderer.id).toBeTruthy();
      expect(renderer.name).toBeTruthy();
      expect(typeof renderer.component).toBe('function');
      expect(renderer.workerEntry).toBeTruthy();
      expect(renderer.workerRequirements).toBeTruthy();
      expect(renderer.workerRequirements?.requiredCapabilities?.length ?? 0).toBeGreaterThan(0);
      expect(renderer.packageManifest).toBeTruthy();
      expect(renderer.packageManifest?.schemaVersion).toBe('1.0.0');
      expect(renderer.packageManifest?.sdk?.minWorkerProtocolVersion).toBeTruthy();
      expect(renderer.controlSchema).toBeTruthy();
      expect(renderer.declarativeSchema).toBeTruthy();
    });
  });

  it('webgl RendererControlSpec has unique ids and valid slider constraints', () => {
    const controls = webglRendererControlSpec.standard;
    const ids = controls.map((control) => control.id);

    expect(controls.length).toBeGreaterThan(0);
    assertUniqueIds(ids);
    controls.forEach(validateStandardSliderConstraints);
  });

  it('dvd RendererControlSpec has unique ids and valid slider/select/text constraints', () => {
    const controls = dvdScreensaverDeclarativeSchema.standard;
    const ids = controls.map((control) => control.id);

    expect(controls.length).toBeGreaterThan(0);
    assertUniqueIds(ids);

    controls.forEach((control) => {
      if (control.type === 'slider') {
        validateStandardSliderConstraints(control);
      }
      if (control.type === 'select') {
        const options = control.constraints?.select?.options;
        expect(Array.isArray(options)).toBe(true);
        expect(options.length).toBeGreaterThan(0);
      }
      if (control.type === 'text') {
        expect(control.constraints?.text).toBeDefined();
      }
    });
  });

  it('concentric DeclarativeControlSchema has unique control ids and valid slider ranges', () => {
    const controls = concentricDeclarativeSchema.sections.flatMap((section) => section.controls);
    const ids = controls.map((control) => control.id);

    expect(concentricDeclarativeSchema.rendererId).toBe('concentric');
    expect(concentricDeclarativeSchema.sections.length).toBeGreaterThan(0);
    assertUniqueIds(ids);
    controls.forEach(validateDeclarativeSliderConstraints);
  });
});
