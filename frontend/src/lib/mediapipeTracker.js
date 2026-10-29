/**
 * Real-Time MediaPipe Pose Detection & Biomechanical Posture Tracker
 * Features Interval-Based Auto-Detection (periodic interval sampling instead of continuous frame-by-frame)
 * for rock-solid stability and zero mid-frame flicker.
 */

export const EXERCISE_INFO = {
  squat: {
    id: 'squat',
    name: 'Squats',
    shortName: 'Squats',
    category: 'Lower Body',
    cue: 'Push knees outward, sink hips below 90°',
  },
  pushup: {
    id: 'pushup',
    name: 'Push-Ups',
    shortName: 'Push-Ups',
    category: 'Upper Body',
    cue: 'Keep rigid plank line, lower chest to floor',
  },
  plank: {
    id: 'plank',
    name: 'Plank Hold',
    shortName: 'Plank',
    category: 'Core Stability',
    cue: 'Straight line through shoulder, hip, and ankle',
  },
  jumpingjack: {
    id: 'jumpingjack',
    name: 'Jumping Jacks',
    shortName: 'Jumping Jacks',
    category: 'Full Body Cardio',
    cue: 'Clap overhead, spread feet wide',
  },
  bicepcurl: {
    id: 'bicepcurl',
    name: 'Bicep Curls',
    shortName: 'Bicep Curls',
    category: 'Arms Isolation',
    cue: 'Pin elbows to ribcage, eliminate torso swing',
  },
};

// Helper: Calculate 2D/3D angle at joint B given points A, B, C (in degrees)
export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return 180;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

// Helper: Torso angle relative to vertical y-axis
export function calculateTorsoAngle(shoulder, hip) {
  if (!shoulder || !hip) return 0;
  const dx = Math.abs(hip.x - shoulder.x);
  const dy = Math.abs(hip.y - shoulder.y);
  return Math.round((Math.atan2(dx, dy) * 180.0) / Math.PI);
}

export class BiomechanicsEngine {
  constructor(detectionIntervalMs = 2000) {
    this.reps = 0;
    this.phase = 'ready';
    this.formScore = 100;
    this.formErrors = [];
    this.feedback = 'Stand in view to start tracking';
    this.activeExercise = 'squat';

    // Start timestamps
    this.sessionStartTime = Date.now();
    this.exerciseStartTime = Date.now();
    this.exerciseStartedFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Plank hold timer state
    this.holdSeconds = 0;
    this.lastHoldTick = Date.now();

    // Moving average buffers for smoothing
    this.angleBuffers = {};

    // Interval-based detection state (samples every 2000ms by default)
    this.detectionIntervalMs = detectionIntervalMs;
    this.lastDetectionCheckTime = 0;
    this.detectedExercise = 'squat';
    this.detectionConfidence = 96;

    // Kinematic velocities & previous frame cache
    this.lastAngles = null;
    this.lastHipY = null;
  }

  setInterval(intervalMs) {
    this.detectionIntervalMs = Math.max(500, intervalMs);
  }

  reset() {
    this.reps = 0;
    this.phase = 'ready';
    this.formScore = 100;
    this.formErrors = [];
    this.feedback = 'Ready';
    this.holdSeconds = 0;
    this.lastHoldTick = Date.now();
    this.angleBuffers = {};
    this.lastDetectionCheckTime = 0;
    this.exerciseStartTime = Date.now();
    this.exerciseStartedFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  setExercise(exercise) {
    if (this.activeExercise !== exercise) {
      this.activeExercise = exercise;
      this.reset();
    }
  }

  smooth(key, val, windowSize = 4) {
    if (!this.angleBuffers[key]) {
      this.angleBuffers[key] = [];
    }
    this.angleBuffers[key].push(val);
    if (this.angleBuffers[key].length > windowSize) {
      this.angleBuffers[key].shift();
    }
    const sum = this.angleBuffers[key].reduce((a, b) => a + b, 0);
    return Math.round(sum / this.angleBuffers[key].length);
  }

  /**
   * Interval-Based Posture Classifier:
   * Only evaluated periodically (every interval, e.g. 2.0s) instead of every frame.
   * Compares joint geometry and velocities to classify posture and confidence.
   */
  classifyPostureAtInterval(angles, landmarks, velocities) {
    const { torso, knee, elbow } = angles;
    const { elbowVelocity, hipYDelta } = velocities;

    // 1. Horizontal Posture (Floor exercises: Push-Up or Plank)
    if (torso >= 42) {
      if (elbowVelocity > 1.0 || elbow <= 110) {
        return { exercise: 'pushup', confidence: 95 };
      }
      return { exercise: 'plank', confidence: 94 };
    }

    // 2. Upright Standing Posture (torso < 42°)
    const armsUp = landmarks[15].y < landmarks[11].y && landmarks[16].y < landmarks[12].y;
    const feetDist = Math.abs(landmarks[27].x - landmarks[28].x);
    const hipDist = Math.abs(landmarks[23].x - landmarks[24].x);
    const feetWide = feetDist > (hipDist * 1.4) || feetDist > 0.32;

    // Jumping Jacks: Arms raised high or feet wide
    if (armsUp || feetWide) {
      return { exercise: 'jumpingjack', confidence: 96 };
    }

    // Squats: Knee flexion (<= 135°) or active vertical hip descent
    if (knee <= 135 || hipYDelta > 0.012) {
      return { exercise: 'squat', confidence: 95 };
    }

    // Bicep Curls: Elbow flexed (<= 115°) with knees straight (> 145°)
    if (elbow <= 115 && knee > 145) {
      return { exercise: 'bicepcurl', confidence: 94 };
    }

    // Neutral standing rest position: maintain current detected standing exercise
    return { exercise: this.detectedExercise || 'squat', confidence: 92 };
  }

  process(landmarks, selectedExercise = 'auto') {
    if (!landmarks || landmarks.length < 33) {
      return {
        bodyVisible: false,
        reps: this.reps,
        phase: this.phase,
        formScore: 100,
        formErrors: ['body_not_visible'],
        feedback: 'Step into frame so your whole body is visible',
        angles: {},
        holdSeconds: this.holdSeconds,
        detectedInfo: EXERCISE_INFO[this.detectedExercise] || EXERCISE_INFO.squat,
        confidence: this.detectionConfidence,
        exerciseStartedFormatted: this.exerciseStartedFormatted,
        exerciseActiveDurationSecs: 0,
        detectionIntervalSecs: this.detectionIntervalMs / 1000,
      };
    }

    // Landmark visibility check (shoulders, hips, knees)
    const keyIndices = [11, 12, 23, 24, 25, 26];
    const avgVis =
      keyIndices.reduce((acc, idx) => acc + (landmarks[idx]?.visibility ?? 1.0), 0) /
      keyIndices.length;

    if (avgVis < 0.40) {
      return {
        bodyVisible: false,
        reps: this.reps,
        phase: this.phase,
        formScore: 100,
        formErrors: ['poor_visibility'],
        feedback: 'Adjust camera; ensure shoulders, hips & knees are in view',
        angles: {},
        holdSeconds: this.holdSeconds,
        detectedInfo: EXERCISE_INFO[this.detectedExercise] || EXERCISE_INFO.squat,
        confidence: this.detectionConfidence,
        exerciseStartedFormatted: this.exerciseStartedFormatted,
        exerciseActiveDurationSecs: 0,
        detectionIntervalSecs: this.detectionIntervalMs / 1000,
      };
    }

    // Extract joint angles
    const rawLeftKnee = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
    const rawRightKnee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
    const rawLeftHip = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
    const rawRightHip = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
    const rawLeftElbow = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
    const rawRightElbow = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
    const rawTorso = calculateTorsoAngle(landmarks[11], landmarks[23]);

    // Smoothed angles
    const leftKnee = this.smooth('lk', rawLeftKnee);
    const rightKnee = this.smooth('rk', rawRightKnee);
    const leftHip = this.smooth('lh', rawLeftHip);
    const rightHip = this.smooth('rh', rawRightHip);
    const leftElbow = this.smooth('le', rawLeftElbow);
    const rightElbow = this.smooth('re', rawRightElbow);
    const torso = this.smooth('torso', rawTorso);

    const knee = Math.round((leftKnee + rightKnee) / 2);
    const hip = Math.round((leftHip + rightHip) / 2);
    const elbow = Math.round((leftElbow + rightElbow) / 2);

    const angles = {
      knee,
      hip,
      elbow,
      torso,
      leftKnee,
      rightKnee,
      leftHip,
      rightHip,
      leftElbow,
      rightElbow,
    };

    // Calculate kinematic velocities
    const midHipY = (landmarks[23].y + landmarks[24].y) / 2;
    const hipYDelta = this.lastHipY !== null ? Math.abs(midHipY - this.lastHipY) : 0;
    const kneeVelocity = this.lastAngles ? Math.abs(knee - this.lastAngles.knee) : 0;
    const elbowVelocity = this.lastAngles ? Math.abs(elbow - this.lastAngles.elbow) : 0;

    this.lastAngles = { knee, hip, elbow, torso };
    this.lastHipY = midHipY;

    // Handle Interval-Based Auto-Detection
    const isAuto =
      selectedExercise.toLowerCase() === 'auto' ||
      selectedExercise.toLowerCase() === 'auto-detect';

    let effectiveExercise = selectedExercise.toLowerCase();

    if (isAuto) {
      const now = Date.now();
      // Only sample posture when interval (e.g. 2000ms) has elapsed
      if (now - this.lastDetectionCheckTime >= this.detectionIntervalMs) {
        this.lastDetectionCheckTime = now;
        const result = this.classifyPostureAtInterval(angles, landmarks, {
          kneeVelocity,
          elbowVelocity,
          hipYDelta,
        });

        // If posture has changed at this interval, switch exercise cleanly
        if (result.exercise !== this.detectedExercise) {
          this.detectedExercise = result.exercise;
          this.exerciseStartTime = now;
          this.exerciseStartedFormatted = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          this.phase = 'ready';
          this.holdSeconds = 0;
          this.lastHoldTick = now;
        }
        this.detectionConfidence = result.confidence;
      }

      effectiveExercise = this.detectedExercise;
    } else {
      this.detectedExercise = effectiveExercise;
      this.detectionConfidence = 100;
    }

    // Evaluate state machine & posture rules for current effective exercise
    switch (effectiveExercise) {
      case 'squat':
        this.evaluateSquat(angles, landmarks);
        break;
      case 'pushup':
      case 'push-up':
        this.evaluatePushup(angles, landmarks);
        break;
      case 'plank':
        this.evaluatePlank(angles, landmarks);
        break;
      case 'jumpingjack':
      case 'jumping jack':
        this.evaluateJumpingJack(angles, landmarks);
        break;
      case 'bicepcurl':
      case 'bicep curl':
        this.evaluateBicepCurl(angles, landmarks);
        break;
      default:
        this.evaluateSquat(angles, landmarks);
        break;
    }

    const detectedInfo =
      EXERCISE_INFO[effectiveExercise] ||
      EXERCISE_INFO[this.detectedExercise] ||
      EXERCISE_INFO.squat;

    const exerciseActiveDurationSecs = Math.max(
      0,
      Math.floor((Date.now() - this.exerciseStartTime) / 1000)
    );

    return {
      bodyVisible: true,
      isAuto,
      exercise: effectiveExercise,
      detectedInfo,
      confidence: this.detectionConfidence,
      exerciseStartedFormatted: this.exerciseStartedFormatted,
      exerciseActiveDurationSecs,
      detectionIntervalSecs: this.detectionIntervalMs / 1000,
      reps: this.reps,
      phase: this.phase,
      formScore: this.formScore,
      formErrors: this.formErrors,
      feedback: this.feedback,
      angles,
      holdSeconds: this.holdSeconds,
    };
  }

  evaluateSquat(angles, landmarks) {
    const { knee, torso } = angles;
    const errors = [];
    let score = 100;
    let cue = 'Maintain steady tempo';

    // Form check: Knees caving (Valgus)
    const kneeDist = Math.abs(landmarks[25].x - landmarks[26].x);
    const ankleDist = Math.abs(landmarks[27].x - landmarks[28].x);
    if (ankleDist > 0.05 && kneeDist / ankleDist < 0.72) {
      errors.push('knees_caving');
      score -= 25;
      cue = 'Push your knees outward over toes';
    }

    // Form check: Excessive forward lean
    if (torso > 45) {
      errors.push('excessive_lean');
      score -= 20;
      cue = 'Keep your chest up and proud';
    }

    // State machine: standing -> down -> bottom (< 98) -> up -> standing
    if (this.phase === 'ready' || this.phase === 'standing' || this.phase === 'up') {
      if (knee <= 125) {
        this.phase = 'down';
        cue = 'Sink hips lower...';
      }
    } else if (this.phase === 'down') {
      if (knee <= 98) {
        this.phase = 'bottom';
        cue = 'Great depth! Now drive up through heels';
      } else if (knee > 140) {
        errors.push('shallow_depth');
        cue = 'Squat lower: reach 90 degrees';
        this.phase = 'standing';
      }
    } else if (this.phase === 'bottom') {
      if (knee >= 155) {
        this.reps += 1;
        this.phase = 'standing';
        cue = 'Rep complete! Excellent form';
      }
    }

    this.formScore = Math.max(20, score);
    this.formErrors = errors;
    this.feedback = errors.length > 0 ? cue : cue || 'Squat down smoothly';
  }

  evaluatePushup(angles, _landmarks) {
    const { elbow, hip } = angles;
    const errors = [];
    let score = 100;
    let cue = 'Maintain straight plank alignment';

    if (hip < 150) {
      errors.push('hips_piking');
      score -= 25;
      cue = 'Lower your hips into a straight line';
    } else if (hip > 200) {
      errors.push('hips_sagging');
      score -= 25;
      cue = 'Tighten abs, prevent hips from sagging';
    }

    if (this.phase === 'ready' || this.phase === 'top' || this.phase === 'up' || this.phase === 'standing') {
      if (elbow <= 120) {
        this.phase = 'down';
        cue = 'Lower chest to floor...';
      }
    } else if (this.phase === 'down') {
      if (elbow <= 90) {
        this.phase = 'bottom';
        cue = 'Full depth! Press the floor away';
      }
    } else if (this.phase === 'bottom') {
      if (elbow >= 155) {
        this.reps += 1;
        this.phase = 'top';
        cue = 'Strong lockout! Rep counted';
      }
    }

    this.formScore = Math.max(20, score);
    this.formErrors = errors;
    this.feedback = cue;
  }

  evaluatePlank(angles, _landmarks) {
    const { hip } = angles;
    const errors = [];
    let score = 100;
    let cue = 'Holding solid plank';

    const now = Date.now();
    const dt = (now - this.lastHoldTick) / 1000;
    this.lastHoldTick = now;

    if (hip < 155) {
      errors.push('hips_piking');
      score -= 30;
      cue = 'Hips too high! Lower them to shoulder level';
      this.phase = 'paused';
    } else if (hip > 195) {
      errors.push('hips_sagging');
      score -= 30;
      cue = 'Hips sagging! Engage glutes and core';
      this.phase = 'paused';
    } else {
      this.phase = 'holding';
      this.holdSeconds += dt;
      this.reps = Math.floor(this.holdSeconds);
      cue = `Hold steady! ${Math.floor(this.holdSeconds)}s`;
    }

    this.formScore = Math.max(20, score);
    this.formErrors = errors;
    this.feedback = cue;
  }

  evaluateJumpingJack(_angles, landmarks) {
    const armsUp = landmarks[15].y < landmarks[11].y && landmarks[16].y < landmarks[12].y;
    const feetDist = Math.abs(landmarks[27].x - landmarks[28].x);
    const hipDist = Math.abs(landmarks[23].x - landmarks[24].x);
    const feetWide = feetDist > (hipDist * 1.4) || feetDist > 0.32;

    if (this.phase === 'ready' || this.phase === 'closed' || this.phase === 'standing') {
      if (armsUp && feetWide) {
        this.phase = 'open';
      }
    } else if (this.phase === 'open') {
      if (!armsUp && !feetWide) {
        this.reps += 1;
        this.phase = 'closed';
      }
    }

    this.formScore = 100;
    this.formErrors = [];
    this.feedback = 'Keep light on your toes and maintain tempo!';
  }

  evaluateBicepCurl(angles, _landmarks) {
    const { elbow, torso } = angles;
    const errors = [];
    let score = 100;
    let cue = 'Curl smoothly, isolate biceps';

    if (torso > 18) {
      errors.push('torso_swing');
      score -= 30;
      cue = 'Stop swinging back; isolate arms';
    }

    if (this.phase === 'ready' || this.phase === 'down' || this.phase === 'standing') {
      if (elbow <= 75) {
        this.phase = 'curled';
        cue = 'Full squeeze at top!';
      }
    } else if (this.phase === 'curled') {
      if (elbow >= 145) {
        this.reps += 1;
        this.phase = 'down';
        cue = 'Full extension. Rep counted!';
      }
    }

    this.formScore = Math.max(20, score);
    this.formErrors = errors;
    this.feedback = cue;
  }
}
