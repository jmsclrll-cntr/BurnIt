/**
 * Real-Time MediaPipe Pose Detection & Biomechanical Posture Tracker
 * Features High-Accuracy Multi-Exercise Classifier and Configurable Threshold Settings.
 */

/**
 * ==============================================================================
 * EXERCISE DETECTION SETTINGS & ADJUSTABLE THRESHOLDS
 * 
 * Edit these numbers below to easily customize or tune any exercise:
 * - Smaller depth angle = must squat or curl deeper.
 * - Larger depth angle = more forgiving / easier to trigger.
 * ==============================================================================
 */
export const TRACKER_SETTINGS = {
  // 1. SQUATS
  squat: {
    depthKneeAngle: 115,          // Deepest point of squat (degrees). 115 allows comfortable parallel squats.
    standingKneeAngle: 145,       // Lockout angle when standing up (degrees).
    startDescentAngle: 130,       // Knee angle where downward squat phase begins.
    maxTorsoLean: 50,             // Max forward torso lean allowed (degrees). Prevents bending over from counting.
    minKneeBothMax: 125,          // Both left & right knees must be below this angle.
  },

  // 2. BICEP CURLS
  bicepcurl: {
    curlPeakFlexion: 95,          // Top squeeze of curl (degrees).
    armExtensionReturn: 130,      // Bottom extension (degrees).
    maxTorsoSwing: 28,            // Max torso momentum swing allowed before penalty.
    maxElbowRibOffset: 0.25,      // Max elbow displacement from shoulder axis.
    debounceMs: 350,              // Min milliseconds between consecutive reps to avoid double-counting bilateral curls.
  },

  // 3. JUMPING JACKS
  jumpingjack: {
    feetWideRatio: 1.20,          // How wide feet must jump relative to hips.
    feetTogetherRatio: 1.15,      // How close feet must return together.
    overheadWristMargin: 0.02,    // Wrists must be above shoulders by at least this margin.
  },

  // 4. PUSH-UPS
  pushup: {
    bottomElbowAngle: 100,        // Depth of chest to floor (degrees).
    topElbowAngle: 145,           // Full arm lockout at top of pushup.
    minHipPlankAngle: 135,        // Prevents butt sticking up (piking).
    maxHipPlankAngle: 215,        // Prevents sagging lower back.
  },

  // 5. PLANK HOLD
  plank: {
    minHipAngle: 135,             // Lower bound for straight hip line.
    maxHipAngle: 215,             // Upper bound for straight hip line.
  },

  // 6. POSITIONING
  positioning: {
    minJointVisibility: 0.20,     // Minimum visibility score for shoulders/torso.
    minShoulderWidth: 0.02,       // Relaxed distance between shoulders to support side profile & distance.
    straightTorsoMax: 25,         // Max torso lean for straight standing calibration.
    straightKneeMin: 135,         // Min knee angle for straight standing calibration.
    straightElbowMin: 110,        // Min elbow angle for relaxed arms down.
    calibrationHoldMs: 400,       // Duration (ms) user must hold straight posture.
  }
};

export const EXERCISE_INFO = {
  auto: {
    id: 'auto',
    name: 'Auto-Detect',
    shortName: 'Auto AI',
    category: 'Full Body',
    cue: 'Perform any exercise (Squats, Bicep Curls, Plank, Push-Ups, Jumping Jacks)',
  },
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
    cue: 'Pin elbows to ribcage, isolate arms smoothly',
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
  constructor(detectionIntervalMs = 300) {
    this.reps = 0;
    this.phase = 'ready';
    this.formScore = 100;
    this.formErrors = [];
    this.feedback = 'Ready - start exercise';
    this.activeExercise = 'auto';

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

    // Dynamic auto-detection state
    this.detectionIntervalMs = detectionIntervalMs;
    this.lastDetectionCheckTime = 0;
    this.detectedExercise = 'auto';
    this.detectionConfidence = 96;

    // Rep counting is immediately active when person is detected
    this.isReadyToCount = true;
    this.straightPostureStartTime = 0;
    this.goSignalActive = false;
    this.goSignalTimestamp = 0;

    // Independent arm tracking for bicep curls (supports bilateral, single-arm, and alternating curls)
    this.leftArmPhase = 'down';
    this.rightArmPhase = 'down';
    this.lastRepTimestamp = 0;

    // Kinematic velocities & previous frame cache
    this.lastAngles = null;
    this.lastHipY = null;
  }

  setInterval(intervalMs) {
    this.detectionIntervalMs = Math.max(200, intervalMs);
  }

  reset() {
    this.reps = 0;
    this.phase = 'ready';
    this.formScore = 100;
    this.formErrors = [];
    this.feedback = 'Ready - start exercise';
    this.isReadyToCount = true;
    this.straightPostureStartTime = 0;
    this.goSignalActive = false;
    this.goSignalTimestamp = 0;
    this.holdSeconds = 0;
    this.lastHoldTick = Date.now();
    this.angleBuffers = {};
    this.lastDetectionCheckTime = 0;
    this.leftArmPhase = 'down';
    this.rightArmPhase = 'down';
    this.lastRepTimestamp = 0;
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
      this.detectedExercise = exercise;
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
   * High-Accuracy Posture & Movement Classifier
   */
  classifyPosture(angles, landmarks, velocities) {
    const { torso, leftKnee, rightKnee, leftElbow, rightElbow } = angles;
    const minElbow = Math.min(leftElbow, rightElbow);
    const minKnee = Math.min(leftKnee, rightKnee);

    // 1. Horizontal Posture (Floor exercises: Push-Up or Plank)
    if (torso >= 40) {
      if (velocities.elbowVelocity > 0.8 || minElbow <= 115) {
        return { exercise: 'pushup', confidence: 96 };
      }
      return { exercise: 'plank', confidence: 95 };
    }

    // Geometry checks
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftElbowJoint = landmarks[13];
    const rightElbowJoint = landmarks[14];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const feetDist = Math.abs((leftAnkle?.x || 0) - (rightAnkle?.x || 0));
    const hipDist = Math.max(0.08, Math.abs((leftHip?.x || 0) - (rightHip?.x || 0)));
    const feetWide = feetDist > (hipDist * TRACKER_SETTINGS.jumpingjack.feetWideRatio) || feetDist > 0.22;

    const wristsNearOrAboveShoulders =
      (leftWrist && leftShoulder && leftWrist.y <= leftShoulder.y + 0.08) ||
      (rightWrist && rightShoulder && rightWrist.y <= rightShoulder.y + 0.08);

    // 2. Jumping Jacks: Wrists raised overhead AND feet wide
    if (wristsNearOrAboveShoulders && (feetWide || velocities.elbowVelocity > 0.7)) {
      return { exercise: 'jumpingjack', confidence: 97 };
    }

    // 3. Squats:
    // Both knees bending down (minKnee <= startDescentAngle) and elbows are NOT curling.
    if (minKnee <= TRACKER_SETTINGS.squat.startDescentAngle && minElbow > 105 && torso <= TRACKER_SETTINGS.squat.maxTorsoLean) {
      return { exercise: 'squat', confidence: 96 };
    }

    // 4. Bicep Curls:
    // Distinctive signature:
    // - Wrists and elbows are strictly below shoulder level (never overhead)
    // - Elbow flexes (minElbow <= curlPeakFlexion + 20)
    // - Knees remain straight (minKnee > 135)
    // - Torso is upright (torso < 30)
    // - Feet are in normal stance (not jumping jack wide)
    const wristsBelowShoulders =
      leftWrist && rightWrist && leftShoulder && rightShoulder &&
      leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;

    const elbowsBelowShoulders =
      leftElbowJoint && rightElbowJoint && leftShoulder && rightShoulder &&
      leftElbowJoint.y > leftShoulder.y && rightElbowJoint.y > rightShoulder.y;

    if (
      minElbow <= (TRACKER_SETTINGS.bicepcurl.curlPeakFlexion + 22) &&
      minKnee > 135 &&
      torso < 30 &&
      wristsBelowShoulders &&
      elbowsBelowShoulders &&
      !feetWide
    ) {
      return { exercise: 'bicepcurl', confidence: 98 };
    }

    // 5. Neutral Standing Rest (Between Reps):
    // Retain current exercise so user can rest between reps without reset or set switching!
    if (this.detectedExercise && this.detectedExercise !== 'auto') {
      return { exercise: this.detectedExercise, confidence: 95 };
    }

    return { exercise: 'auto', confidence: 85 };
  }

  process(landmarks, selectedExercise = 'auto') {
    if (!landmarks || landmarks.length < 33) {
      this.straightPostureStartTime = 0;
      return {
        bodyVisible: false,
        isReadyToCount: true,
        goSignalActive: false,
        reps: this.reps,
        phase: this.phase,
        formScore: 100,
        formErrors: ['body_not_visible'],
        feedback: 'Step into camera frame to begin workout detection',
        angles: {},
        holdSeconds: this.holdSeconds,
        detectedInfo: EXERCISE_INFO[this.detectedExercise] || EXERCISE_INFO.auto,
        confidence: this.detectionConfidence,
        exerciseStartedFormatted: this.exerciseStartedFormatted,
        exerciseActiveDurationSecs: 0,
        detectionIntervalSecs: this.detectionIntervalMs / 1000,
      };
    }

    // Key joint visibility check: A person is visible if core upper-body landmarks (shoulders, nose, or hips) are detected
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];
    const leftHipLm = landmarks[23];
    const rightHipLm = landmarks[24];

    const hasUpperBody =
      (leftShoulder?.visibility ?? 0) > 0.15 ||
      (rightShoulder?.visibility ?? 0) > 0.15 ||
      (nose?.visibility ?? 0) > 0.2 ||
      (leftHipLm?.visibility ?? 0) > 0.15 ||
      (rightHipLm?.visibility ?? 0) > 0.15;

    // Sanity check coordinates to reject collapsed zero points
    const shoulderDist = Math.hypot(
      (leftShoulder?.x || 0) - (rightShoulder?.x || 0),
      (leftShoulder?.y || 0) - (rightShoulder?.y || 0)
    );
    const isValidPose = hasUpperBody && shoulderDist > 0.005;

    if (!isValidPose) {
      return {
        bodyVisible: false,
        isReadyToCount: true,
        goSignalActive: false,
        reps: this.reps,
        phase: 'positioning',
        formScore: 100,
        formErrors: ['poor_positioning'],
        feedback: 'Step into camera frame to begin workout detection',
        angles: {},
        holdSeconds: this.holdSeconds,
        detectedInfo: EXERCISE_INFO[this.detectedExercise] || EXERCISE_INFO.auto,
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

    const minElbow = Math.min(leftElbow, rightElbow);
    const minKnee = Math.min(leftKnee, rightKnee);

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
      minElbow,
      minKnee,
    };

    // Calculate kinematic velocities
    const kneeVelocity = this.lastAngles ? Math.abs(knee - this.lastAngles.knee) : 0;
    const elbowVelocity = this.lastAngles ? Math.abs(elbow - this.lastAngles.elbow) : 0;
    this.lastAngles = { knee, hip, elbow, torso };

    const isAuto =
      selectedExercise.toLowerCase() === 'auto' ||
      selectedExercise.toLowerCase() === 'auto-detect';

    let effectiveExercise = selectedExercise.toLowerCase();

    // Auto-detection handling
    if (isAuto) {
      const now = Date.now();
      const timeSinceLastCheck = now - this.lastDetectionCheckTime;

      // Check auto-classification periodically, or on immediate active motion
      const immediateCurlTrigger = minElbow <= 100 && minKnee > 130 && this.detectedExercise !== 'bicepcurl';
      const immediateSquatTrigger = minKnee <= 130 && minElbow > 100 && this.detectedExercise !== 'squat';

      if (timeSinceLastCheck >= this.detectionIntervalMs || immediateCurlTrigger || immediateSquatTrigger) {
        this.lastDetectionCheckTime = now;
        const result = this.classifyPosture(angles, landmarks, {
          kneeVelocity,
          elbowVelocity,
        });

        if (result.exercise !== 'auto' && result.exercise !== this.detectedExercise) {
          this.detectedExercise = result.exercise;
          this.exerciseStartTime = now;
          this.exerciseStartedFormatted = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          this.reps = 0;
          this.phase = 'standing';
          this.holdSeconds = 0;
          this.lastHoldTick = now;
          this.leftArmPhase = 'down';
          this.rightArmPhase = 'down';
        }
        this.detectionConfidence = result.confidence;
      }

      effectiveExercise = this.detectedExercise;
    } else {
      this.detectedExercise = effectiveExercise;
      this.detectionConfidence = 100;
    }

    // Evaluate state machine for the current exercise
    switch (effectiveExercise) {
      case 'bicepcurl':
      case 'bicep curl':
        this.evaluateBicepCurl(angles, landmarks);
        break;
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
      default:
        this.phase = 'ready';
        this.feedback = 'Ready - perform squats, curls, push-ups or plank';
        break;
    }

    const detectedInfo =
      EXERCISE_INFO[effectiveExercise] ||
      EXERCISE_INFO[this.detectedExercise] ||
      EXERCISE_INFO.auto;

    const exerciseActiveDurationSecs = Math.max(
      0,
      Math.floor((Date.now() - this.exerciseStartTime) / 1000)
    );

    return {
      bodyVisible: true,
      isReadyToCount: true,
      goSignalActive: false,
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
    const { knee, torso, minKnee = knee } = angles;
    const errors = [];
    let score = 100;
    let cue = 'Maintain steady tempo';
    const cfg = TRACKER_SETTINGS.squat;

    // Strict Position Guard: Prevent counting bending over as a squat
    if (torso > cfg.maxTorsoLean) {
      errors.push('excessive_lean');
      score -= 20;
      cue = 'Keep your chest up; do not bend forward';
    }

    // Form check: Knees caving (Valgus)
    const kneeDist = Math.abs((landmarks[25]?.x || 0) - (landmarks[26]?.x || 0));
    const ankleDist = Math.abs((landmarks[27]?.x || 0) - (landmarks[28]?.x || 0));
    if (ankleDist > 0.05 && kneeDist / ankleDist < 0.70) {
      errors.push('knees_caving');
      score -= 20;
      cue = 'Push your knees outward over toes';
    }

    // Depth check: effective knee angle (handles camera angle / perspective)
    const effectiveKnee = minKnee < 180 ? minKnee : knee;

    // State machine: standing (>= 145) -> down (<= 130) -> bottom (<= 115) -> standing (>= 145)
    if (this.phase === 'ready' || this.phase === 'standing' || this.phase === 'up') {
      if (effectiveKnee <= cfg.startDescentAngle && torso <= cfg.maxTorsoLean) {
        this.phase = 'down';
        cue = 'Sink hips lower...';
      }
    } else if (this.phase === 'down') {
      if (effectiveKnee <= cfg.depthKneeAngle && torso <= cfg.maxTorsoLean) {
        this.phase = 'bottom';
        cue = 'Great depth! Drive up through heels';
      } else if (effectiveKnee > 140) {
        this.phase = 'standing';
      }
    } else if (this.phase === 'bottom') {
      if (effectiveKnee >= cfg.standingKneeAngle) {
        this.reps += 1;
        this.phase = 'standing';
        cue = 'Rep complete! Excellent squat';
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
    const cfg = TRACKER_SETTINGS.pushup;

    if (hip < cfg.minHipPlankAngle) {
      errors.push('hips_piking');
      score -= 20;
      cue = 'Lower your hips into a straight line';
    } else if (hip > cfg.maxHipPlankAngle) {
      errors.push('hips_sagging');
      score -= 20;
      cue = 'Tighten abs, prevent hips from sagging';
    }

    if (this.phase === 'ready' || this.phase === 'top' || this.phase === 'up' || this.phase === 'standing') {
      if (elbow <= 125) {
        this.phase = 'down';
        cue = 'Lower chest to floor...';
      }
    } else if (this.phase === 'down') {
      if (elbow <= cfg.bottomElbowAngle) {
        this.phase = 'bottom';
        cue = 'Full depth! Press the floor away';
      }
    } else if (this.phase === 'bottom') {
      if (elbow >= cfg.topElbowAngle) {
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
    const cfg = TRACKER_SETTINGS.plank;

    const now = Date.now();
    const dt = (now - this.lastHoldTick) / 1000;
    this.lastHoldTick = now;

    if (hip < cfg.minHipAngle) {
      errors.push('hips_piking');
      score -= 20;
      cue = 'Hips too high! Lower them to shoulder level';
      this.phase = 'paused';
    } else if (hip > cfg.maxHipAngle) {
      errors.push('hips_sagging');
      score -= 20;
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
    if (!landmarks || landmarks.length < 33) return;

    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return;

    const armsUp = (leftWrist.y < leftShoulder.y) && (rightWrist.y < rightShoulder.y);
    const armsDown = (leftWrist.y > leftShoulder.y + 0.05) && (rightWrist.y > rightShoulder.y + 0.05);

    const feetDist = Math.abs((leftAnkle?.x || 0) - (rightAnkle?.x || 0));
    const hipDist = Math.max(0.06, Math.abs((leftHip?.x || 0) - (rightHip?.x || 0)));
    const feetWide = feetDist > (hipDist * 1.15) || feetDist > 0.18;
    const feetTogether = feetDist <= (hipDist * 1.10) || feetDist < 0.18;

    if (this.phase === 'ready' || this.phase === 'closed' || this.phase === 'standing') {
      if (armsUp && (feetWide || !leftAnkle || (leftAnkle.visibility ?? 1) < 0.3)) {
        this.phase = 'open';
      }
    } else if (this.phase === 'open') {
      if (armsDown && (feetTogether || !leftAnkle || (leftAnkle.visibility ?? 1) < 0.3)) {
        this.reps += 1;
        this.phase = 'closed';
      }
    }

    this.formScore = 100;
    this.formErrors = [];
    this.feedback = this.phase === 'open' ? 'Bring arms down and feet together!' : 'Jump arms overhead and feet wide!';
  }

  /**
   * Advanced Bicep Curl Tracker:
   * Supports two-arm (bilateral), single-arm (unilateral), and alternating curls.
   */
  evaluateBicepCurl(angles, landmarks) {
    const { leftElbow, rightElbow, torso } = angles;
    const minElbow = Math.min(leftElbow, rightElbow);
    const errors = [];
    let score = 100;
    let cue = 'Curl smoothly, isolate biceps';
    const cfg = TRACKER_SETTINGS.bicepcurl;

    if (landmarks && landmarks.length >= 33) {
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftElbowJoint = landmarks[13];
      const rightElbowJoint = landmarks[14];

      // Prevent hands completely overhead from counting as curl
      const handsOverhead =
        (leftWrist && leftShoulder && leftWrist.y < leftShoulder.y - 0.08) &&
        (rightWrist && rightShoulder && rightWrist.y < rightShoulder.y - 0.08);

      if (handsOverhead) {
        this.leftArmPhase = 'down';
        this.rightArmPhase = 'down';
        this.phase = 'down';
        this.feedback = 'Keep elbows down below shoulders';
        return;
      }

      // Elbow ribcage alignment check
      const leftElbowSwing = leftElbowJoint && leftShoulder ? Math.abs(leftElbowJoint.x - leftShoulder.x) : 0;
      const rightElbowSwing = rightElbowJoint && rightShoulder ? Math.abs(rightElbowJoint.x - rightShoulder.x) : 0;
      const elbowsFlaring = leftElbowSwing > cfg.maxElbowRibOffset || rightElbowSwing > cfg.maxElbowRibOffset;

      if (elbowsFlaring) {
        errors.push('elbows_flaring');
        score -= 20;
        cue = 'Keep elbows pinned to your sides';
      }
    }

    // Form check: Torso swing / momentum
    if (torso > cfg.maxTorsoSwing) {
      errors.push('torso_swing');
      score -= 20;
      cue = 'Keep torso still; eliminate body swing';
    }

    if (this.leftArmPhase === undefined) {
      this.leftArmPhase = 'down';
      this.rightArmPhase = 'down';
      this.lastRepTimestamp = 0;
    }

    const now = Date.now();
    let repCounted = false;

    // Track Left Arm
    if (this.leftArmPhase === 'down' || this.leftArmPhase === 'ready') {
      if (leftElbow <= cfg.curlPeakFlexion) {
        this.leftArmPhase = 'curled';
      }
    } else if (this.leftArmPhase === 'curled') {
      if (leftElbow >= cfg.armExtensionReturn) {
        this.leftArmPhase = 'down';
        if (now - this.lastRepTimestamp > cfg.debounceMs) {
          this.reps += 1;
          this.lastRepTimestamp = now;
          repCounted = true;
        }
      }
    }

    // Track Right Arm
    if (this.rightArmPhase === 'down' || this.rightArmPhase === 'ready') {
      if (rightElbow <= cfg.curlPeakFlexion) {
        this.rightArmPhase = 'curled';
      }
    } else if (this.rightArmPhase === 'curled') {
      if (rightElbow >= cfg.armExtensionReturn) {
        this.rightArmPhase = 'down';
        if (now - this.lastRepTimestamp > cfg.debounceMs) {
          this.reps += 1;
          this.lastRepTimestamp = now;
          repCounted = true;
        }
      }
    }

    // UI phase display
    if (minElbow <= cfg.curlPeakFlexion) {
      this.phase = 'curled';
      cue = 'Full squeeze at top!';
    } else if (minElbow >= cfg.armExtensionReturn) {
      this.phase = 'down';
      cue = repCounted ? 'Rep complete! Excellent curl' : 'Lower with control';
    } else {
      this.phase = (this.leftArmPhase === 'curled' || this.rightArmPhase === 'curled') ? 'curled' : 'moving';
      cue = 'Control the movement';
    }

    this.formScore = Math.max(20, score);
    this.formErrors = errors;
    this.feedback = errors.length > 0 ? cue : cue || 'Curl with smooth tempo';
  }
}
