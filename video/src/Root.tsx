import { Composition } from 'remotion';

import { DURACION_TOTAL, FitFatPitch } from './FitFatPitch';

export function RemotionRoot() {
  return (
    <Composition
      id="FitFatPitch"
      component={FitFatPitch}
      durationInFrames={DURACION_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
