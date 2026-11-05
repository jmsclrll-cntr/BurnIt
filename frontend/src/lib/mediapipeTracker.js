/**
 * Real-Time MediaPipe Pose Detection & Biomechanical Posture Tracker
 * Features State Machine Auto-Detection:
 * 1. WAITING_FOR_POSE -> requires visibility > 0.5 across shoulders, hips, knees, ankles
 * 2. HOLD_STEADY -> 2-second continuous still hold with straight posture (hip > 165°, knee > 165°)
 * 3. DETECT -> 15-frame movement-based classification and locking
 * 4. COUNTING -> calibrated rep counting returning near baseline
 * 5. RE-CALIBRATE -> 2s mid-set stillness unlocks and returns to HOLD_STEADY
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

/**
 * Centralized Configuration for Auto-Detect State Machine
 */
export const AUTO_DETECT_CONFIG = {
  STILL_THRESHOLD: 0.055,       // Movement per frame normalized by torso length to be considered still
  HOLD_SECONDS: 2.0,            // Required continuous still hold duration in seconds
  LOCK_FRAMES: 8,               // Consecutive frames (~0.25 - 0.35s) of consistent movement to lock
  INACTIVITY_SECONDS: 2.8,      // Seconds of resting posture stillness before re-calibrating next exercise
  INACTIVITY_PROMPT_SECONDS: 1.8, // Seconds of stillness before showing resting prompt (never shows during quick rep pauses)
  VISIBILITY_THRESHOLD: 0.5,    // Minimum visibility for shoulders, hips, knees, and ankles
  MOVING_AVERAGE_WINDOW: 5,     // Window size for moving average angle smoothing
  ANGLE_LIMITS: {
    MIN_HIP_STRAIGHT: 152,      // Minimum hip angle for straight body hold (realistic for natural standing)
    MIN_KNEE_STRAIGHT: 152,     // Minimum knee angle for straight body hold (realistic for natural standing)
    MAX_STANDING_TORSO: 42,     // Torso angle <= 42° is standing vertical
    MIN_HORIZONTAL_TORSO: 48,   // Torso angle >= 48° is horizontal (plank/push-up)
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
  constructor(config = AUTO_DETECT_CONFIG) {
    this.config = config;
    this.reps = 0;
    this.phase = 'ready';
    this.formScore = 100;
    this.formErrors = [];
    this.feedback = 'Stand in view to start tracking';
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

    // Auto-Detect State Machine
    // States: 'waiting' | 'hold_steady' | 'detecting' | 'counting'
    this.autoState = 'waiting';
    this.isLocked = false;
    this.detectedExercise = 'squat';
    this.detectionConfidence = 100;

    // Hold steady tracking
    this.holdStartTime = null;
    this.holdProgress = 0;

    // Landmark cache & baseline
    this.prevKeyLandmarks = null;
    this.baselinePose = null;

    // Classifier locking state (in 'detecting' state)
    this.candidateExercise = null;
    this.candidateFrames = 0;
    this.missingFrames = 0;

    // Mid-set stillness tracking (in 'counting' state for re-calibration)
    this.stillStartTimeMidSet = null;

    this.sessionPlankSeconds = 0;
    // Per-exercise rep totals for the entire session
    this.sessionExerciseReps = {
      squat: 0,
      pushup: 0,
      plank: 0,
      jumpingjack: 0,
      bicepcurl: 0,
    };

    // Kinematic velocities & previous frame cache
    this.lastAngles = null;
    this.lastHipY = null;
    this.holdUnsteadyFrames = 0;
    this.inactiveGraceFrames = 0;
    this.lastRepTime = 0;
    this.curlingArm = null;
    this.curlFrames = 0;
    this.extendFrames = 0;
    this.torsoLength = 0.25;
    this.candidateScores = {};
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
    this.exerciseStartTime = Date.now();
    this.exerciseStartedFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.holdStartTime = null;
    this.holdProgress = 0;
    this.candidateExercise = null;
    this.candidateFrames = 0;
    this.missingFrames = 0;
    this.stillStartTimeMidSet = null;
    this.isLocked = false;
    this.autoState = 'waiting';
    this.lastRepTime = 0;
    this.curlingArm = null;
    this.curlFrames = 0;
    this.extendFrames = 0;
    this.candidateScores = {};
  }

  /**
   * Resets only the current set's reps/timer without resetting session totals
   */
  resetSet() {
    this.reps = 0;
    this.holdSeconds = 0;
    this.phase = 'ready';
    this.formErrors = [];
    this.feedback = 'Ready for next set';
    this.lastHoldTick = Date.now();
  }

  /**
   * Unlock auto-detect exercise to allow detecting a new exercise
   */
  unlock() {
    this.isLocked = false;
    this.autoState = 'hold_steady';
    this.holdStartTime = null;
    this.holdProgress = 0;
    this.holdUnsteadyFrames = 0;
    this.stillStartTimeMidSet = null;
    this.inactiveGraceFrames = 0;
    this.candidateExercise = null;
    this.candidateFrames = 0;
    this.missingFrames = 0;
    this.phase = 'ready';
    this.feedback = 'Unlocked! Hold steady to detect new exercise.';
  }

  /**
   * Alias for unlock to trigger re-detection / recalibration
   */
  recalibrate() {
    this.unlock();
  }

  /**
   * Resets entire session totals (used on brand-new workout sessions)
   */
  resetSessionTotals() {
    this.sessionPlankSeconds = 0;
    this.sessionExerciseReps = {
      squat: 0,
      pushup: 0,
      plank: 0,
      jumpingjack: 0,
      bicepcurl: 0,
    };
  }

  setExercise(exercise) {
    const isAuto =
      exercise.toLowerCase() === 'auto' ||
      exercise.toLowerCase() === 'auto-detect';

    if (this.activeExercise !== exercise) {
      this.reset();
      this.activeExercise = exercise;
      if (!isAuto) {
        this.detectedExercise = exercise;
        this.isLocked = true;
        this.autoState = 'counting';
      } else {
        this.isLocked = false;
        this.autoState = 'waiting';
      }
    }
  }

  recordRep(exercise) {
    const now = Date.now();
    if (this.lastRepTime && now - this.lastRepTime < 650) {
      return; // Debounce: prevent duplicate counts within 650ms
    }
    this.lastRepTime = now;
    this.reps += 1;
    if (this.sessionExerciseReps[exercise] !== undefined) {
      this.sessionExerciseReps[exercise] += 1;
    } else {
      this.sessionExerciseReps[exercise] = 1;
    }
  }

  smooth(key, val, windowSize = this.config.MOVING_AVERAGE_WINDOW) {
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

  process(landmarks, selectedExercise = 'auto') {
    const isAuto =
      selectedExercise.toLowerCase() === 'auto' ||
      selectedExercise.toLowerCase() === 'auto-detect';

    const now = Date.now();

    // 1. Landmark presence & key joint visibility check
    // WAITING_FOR_POSE: Shoulders, hips, knees, ankles all must have visibility > 0.5
    const requiredJoints = [11, 12, 23, 24, 25, 26, 27, 28]; // shoulders, hips, knees, ankles

    const hasBasicLandmarks = landmarks && landmarks.length >= 33;
    const allKeyJointsVisible =
      hasBasicLandmarks &&
      requiredJoints.every(
        (idx) => (landmarks[idx]?.visibility ?? 0) >= this.config.VISIBILITY_THRESHOLD
      );

    if (!allKeyJointsVisible) {
      if (isAuto) {
        // If actively counting a locked exercise, tolerate momentary landmark dropouts/occlusions (up to 45 frames ~1.5s)
        if (this.autoState === 'counting' && this.isLocked) {
          this.missingFrames = (this.missingFrames || 0) + 1;
          if (this.missingFrames < 45) {
            return {
              bodyVisible: true,
              isAuto,
              autoState: this.autoState,
              isLocked: this.isLocked,
              holdProgress: 0,
              reps: this.reps,
              phase: this.phase,
              formScore: this.formScore,
              formErrors: [],
              feedback: 'Keep going! Keep joints in view',
              angles: this.lastAngles || {},
              holdSeconds: this.holdSeconds,
              detectedInfo: EXERCISE_INFO[this.detectedExercise] || EXERCISE_INFO.squat,
              confidence: this.detectionConfidence,
              exerciseStartedFormatted: this.exerciseStartedFormatted,
              exerciseActiveDurationSecs: Math.max(
                0,
                Math.floor((now - this.exerciseStartTime) / 1000)
              ),
              sessionTotals: { ...this.sessionExerciseReps },
            };
          }
        }

        this.autoState = 'waiting';
        this.holdStartTime = null;
        this.holdProgress = 0;
        this.candidateExercise = null;
        this.candidateFrames = 0;
      }
      return {
        bodyVisible: false,
        isAuto,
        autoState: this.autoState,
        isLocked: this.isLocked,
        holdProgress: 0,
        reps: this.reps,
        phase: this.phase,
        formScore: 100,
        formErrors: ['body_not_visible'],
        feedback: 'Step into camera frame: shoulders, hips, knees & ankles must be visible',
        angles: {},
        holdSeconds: this.holdSeconds,
        detectedInfo: EXERCISE_INFO[this.detectedExercise] || EXERCISE_INFO.squat,
        confidence: this.detectionConfidence,
        exerciseStartedFormatted: this.exerciseStartedFormatted,
        exerciseActiveDurationSecs: 0,
        sessionTotals: { ...this.sessionExerciseReps },
      };
    }

    // Reset missing frames counter when landmarks are fully visible
    this.missingFrames = 0;

    // 2. Extract and smooth joint angles using moving average buffer
    const rawLeftKnee = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
    const rawRightKnee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
    const rawLeftHip = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
    const rawRightHip = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
    const rawLeftElbow = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
    const rawRightElbow = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
    const rawTorso = calculateTorsoAngle(landmarks[11], landmarks[23]);

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
    this.lastAngles = angles;

    // 3. Movement measurement per frame, normalized by torso length
    const shoulderMid = {
      x: (landmarks[11].x + landmarks[12].x) / 2,
      y: (landmarks[11].y + landmarks[12].y) / 2,
    };
    const hipMid = {
      x: (landmarks[23].x + landmarks[24].x) / 2,
      y: (landmarks[23].y + landmarks[24].y) / 2,
    };
    const torsoLength = Math.max(
      0.08,
      Math.hypot(hipMid.x - shoulderMid.x, hipMid.y - shoulderMid.y)
    );
    this.torsoLength = torsoLength;

    let totalDisp = 0;
    let validJointCount = 0;
    const trackedJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    if (this.prevKeyLandmarks) {
      for (const idx of trackedJoints) {
        const cur = landmarks[idx];
        const prev = this.prevKeyLandmarks[idx];
        if (cur && prev) {
          totalDisp += Math.hypot(cur.x - prev.x, cur.y - prev.y);
          validJointCount++;
        }
      }
    }
    this.prevKeyLandmarks = landmarks.map((lm) => ({ x: lm.x, y: lm.y }));
    const avgDisp = validJointCount > 0 ? totalDisp / validJointCount : 0;
    const rawMovement = avgDisp / torsoLength;
    const normalizedMovement = this.smooth('norm_mov', rawMovement, 5);
    const isStill = normalizedMovement <= this.config.STILL_THRESHOLD;

    // 4. AUTO-DETECT STATE MACHINE
    if (isAuto) {
      // Transition from WAITING to HOLD_STEADY once full body is in view
      if (this.autoState === 'waiting') {
        this.autoState = 'hold_steady';
        this.holdStartTime = null;
        this.holdProgress = 0;
      }

      // STATE: HOLD_STEADY
      if (this.autoState === 'hold_steady') {
        const isStraightHips = angles.hip >= this.config.ANGLE_LIMITS.MIN_HIP_STRAIGHT;
        const isStraightKnees = angles.knee >= this.config.ANGLE_LIMITS.MIN_KNEE_STRAIGHT;
        const isStanding = angles.torso <= this.config.ANGLE_LIMITS.MAX_STANDING_TORSO;
        const isHorizontal = angles.torso >= this.config.ANGLE_LIMITS.MIN_HORIZONTAL_TORSO;
        const isValidOrientation = isStanding || isHorizontal;
        const isStraight = isStraightHips && isStraightKnees && isValidOrientation;

        if (isStraight && isStill) {
          this.holdUnsteadyFrames = 0;
          if (!this.holdStartTime) {
            this.holdStartTime = now;
          }
          const elapsed = (now - this.holdStartTime) / 1000;
          this.holdProgress = Math.min(1.0, elapsed / this.config.HOLD_SECONDS);
          this.feedback = `Hold still... ${(Math.max(0, this.config.HOLD_SECONDS - elapsed)).toFixed(1)}s`;

          if (elapsed >= this.config.HOLD_SECONDS) {
            // 2 continuous seconds held! Save baseline pose & transition to DETECT
            this.baselinePose = {
              torsoLength,
              orientation: isStanding ? 'standing' : 'horizontal',
              torsoAngle: angles.torso,
              hipAngle: angles.hip,
              kneeAngle: angles.knee,
              elbowAngle: angles.elbow,
              shoulderMid: { ...shoulderMid },
              hipMid: { ...hipMid },
              feetDist: Math.abs(landmarks[27].x - landmarks[28].x),
              leftWristY: landmarks[15].y,
              rightWristY: landmarks[16].y,
            };
            this.autoState = 'detecting';
            this.candidateExercise = null;
            this.candidateFrames = 0;
            this.holdProgress = 1.0;
            this.feedback = 'Baseline saved! Begin your movement.';
          }
        } else {
          // Allow up to 10 grace frames (~0.33s) of minor noise before resetting timer
          this.holdUnsteadyFrames = (this.holdUnsteadyFrames || 0) + 1;
          if (this.holdUnsteadyFrames > 10) {
            this.holdStartTime = null;
            this.holdProgress = 0;
            if (!isStraight) {
              if (!isValidOrientation) {
                this.feedback = 'Stand upright or hold horizontal plank';
              } else {
                this.feedback = 'Stand straighter';
              }
            } else if (!isStill) {
              this.feedback = 'Hold still';
            }
          }
        }
      }

      // STATE: DETECT (runs once after the 2s hold)
      else if (this.autoState === 'detecting') {
        const baseline = this.baselinePose || {
          orientation: angles.torso <= this.config.ANGLE_LIMITS.MAX_STANDING_TORSO ? 'standing' : 'horizontal',
          torsoLength,
          feetDist: Math.abs(landmarks[27].x - landmarks[28].x),
          shoulderMid,
          hipMid,
        };

        const hipDist = Math.abs(landmarks[23].x - landmarks[24].x);
        const feetDist = Math.abs(landmarks[27].x - landmarks[28].x);
        const baselineFeet = Math.max(0.12, baseline.feetDist || 0.18);
        const hipsDescended = hipMid.y >= baseline.hipMid.y + 0.025;

        // Current body orientation check (dynamic, supports changing posture after baseline)
        const isHorizontalBody =
          angles.torso >= 45 ||
          Math.abs(landmarks[11].y - landmarks[23].y) < 0.16;

        let currentCandidate = null;

        if (isHorizontalBody) {
          // Floor Exercises: Push-Ups vs Plank
          if (
            angles.elbow <= 130 &&
            (shoulderMid.y >= baseline.shoulderMid.y + 0.015 || hipMid.y >= baseline.hipMid.y + 0.015)
          ) {
            currentCandidate = 'pushup';
          } else if (angles.hip >= 140 && angles.knee >= 140) {
            currentCandidate = 'plank';
          }
        } else {
          // Standing Exercises: Squats, Jumping Jacks, Bicep Curls
          const feetWide = feetDist >= Math.max(baselineFeet * 1.25, hipDist * 1.25);
          const armsAboveShoulders =
            landmarks[15].y <= landmarks[11].y + 0.05 || landmarks[16].y <= landmarks[12].y + 0.05;
          const armsSpreadWide =
            Math.abs(landmarks[15].x - landmarks[16].x) >= hipDist * 2.0;

          const tLen = this.torsoLength || 0.25;
          const leftWristDist = landmarks[15] && landmarks[11]
            ? Math.hypot(landmarks[15].x - landmarks[11].x, landmarks[15].y - landmarks[11].y) / tLen
            : 1.2;
          const rightWristDist = landmarks[16] && landmarks[12]
            ? Math.hypot(landmarks[16].x - landmarks[12].x, landmarks[16].y - landmarks[12].y) / tLen
            : 1.2;
          const minWristDist = Math.min(leftWristDist, rightWristDist);
          const minElbowAngle = Math.min(angles.leftElbow || 180, angles.rightElbow || 180);

          // 1. Squats: Knees and hips bend downwards significantly
          if (angles.knee <= 135 && (hipsDescended || angles.hip <= 145)) {
            currentCandidate = 'squat';
          }
          // 2. Jumping Jacks: Feet jump wide AND arms spread laterally wide / overhead, without hips descending
          else if (
            feetWide &&
            (armsAboveShoulders || armsSpreadWide) &&
            !hipsDescended
          ) {
            currentCandidate = 'jumpingjack';
          }
          // 3. Bicep Curls: Arm flexes (elbow <= 120° or wrist comes near shoulder <= 0.85), feet together, hips still
          else if (
            (minElbowAngle <= 120 || minWristDist <= 0.85) &&
            !feetWide &&
            !hipsDescended &&
            angles.knee >= 135
          ) {
            currentCandidate = 'bicepcurl';
          }
        }

        if (currentCandidate) {
          if (!this.candidateScores) this.candidateScores = {};
          this.candidateScores[currentCandidate] = (this.candidateScores[currentCandidate] || 0) + 1;
          const score = this.candidateScores[currentCandidate];
          const targetVotes = 6; // Lock after 6 frames (~0.2s) of consistent candidate evidence
          const candidateInfo = EXERCISE_INFO[currentCandidate];
          const pct = Math.min(100, Math.round((score / targetVotes) * 100));
          this.feedback = `Detecting ${candidateInfo?.name || currentCandidate}... (${pct}%)`;

          if (score >= targetVotes) {
            this.detectedExercise = currentCandidate;
            this.isLocked = true;
            this.autoState = 'counting';
            this.candidateScores = {};
            this.reps = 0;
            this.phase = 'ready';
            this.holdSeconds = 0;
            this.lastHoldTick = now;
            this.exerciseStartTime = now;
            this.exerciseStartedFormatted = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            this.feedback = `Locked: ${candidateInfo?.name}! Start reps.`;
            this.stillStartTimeMidSet = null;
          }
        } else {
          this.feedback = 'Begin your first movement to detect exercise...';
        }
      }

      // STATE: COUNTING & MID-SET RE-CALIBRATE
      else if (this.autoState === 'counting') {
        let isInactive = false;
        const baselineFeet = Math.max(0.12, this.baselinePose?.feetDist || 0.2);
        const feetDist = Math.abs(landmarks[27].x - landmarks[28].x);

        // General resting posture detection:
        // Standing upright, legs extended, arms down/relaxed, not moving
        // Robust upright standing (not deep squat or bent over)
        const standingUpright =
          angles.torso <= this.config.ANGLE_LIMITS.MAX_STANDING_TORSO &&
          angles.knee >= 135;

        // Arms hanging down or relaxed (wrists below shoulders or elbow open)
        const wristsBelowShoulders =
          landmarks[15] && landmarks[11] && landmarks[16] && landmarks[12]
            ? landmarks[15].y > landmarks[11].y && landmarks[16].y > landmarks[12].y
            : true;
        const armsRelaxed = angles.elbow >= 120 || wristsBelowShoulders;

        const isNeutralStanding = standingUpright && armsRelaxed;

        switch (this.detectedExercise) {
          case 'squat': {
            if (isStill && standingUpright) {
              isInactive = true;
            }
            break;
          }
          case 'pushup':
          case 'plank': {
            // Athlete stood up from horizontal or resting horizontal straight
            if (isStill && (standingUpright || (angles.torso >= 45 && angles.hip >= 150))) {
              isInactive = true;
            }
            break;
          }
          case 'bicepcurl': {
            // User finished curls: standing upright, arms relaxed at sides, still
            if (isStill && isNeutralStanding) {
              isInactive = true;
            }
            break;
          }
          case 'jumpingjack': {
            const armsDown = wristsBelowShoulders;
            const feetNarrow = feetDist <= baselineFeet * 1.35;
            if (isStill && armsDown && feetNarrow && standingUpright) {
              isInactive = true;
            }
            break;
          }
          default: {
            if (isStill && isNeutralStanding) {
              isInactive = true;
            }
          }
        }

        // Prevent reset while in active rep phases (e.g. descending, holding bottom, curled, jumping open)
        const isMidRep =
          this.phase === 'down' ||
          this.phase === 'bottom' ||
          this.phase === 'curled' ||
          this.phase === 'open';

        if (isMidRep) {
          isInactive = false;
          this.stillStartTimeMidSet = null;
          this.inactiveGraceFrames = 0;
        }

        // When user is standing steady in neutral posture:
        // Jitter tolerance: allow up to 10 grace frames of noise so standing steady reliably resets.
        // But don't scan/prompt during quick rep pauses (only prompt if stillness >= 1.8s).
        if (isInactive && isStill) {
          this.inactiveGraceFrames = 0;
          if (!this.stillStartTimeMidSet) {
            this.stillStartTimeMidSet = now;
          }
          const stillDuration = (now - this.stillStartTimeMidSet) / 1000;
          if (stillDuration >= this.config.INACTIVITY_SECONDS) {
            this.unlock();
          }
        } else if (!isMidRep && this.stillStartTimeMidSet) {
          // Allow momentary 10-frame tolerance for sensor noise/breathing
          this.inactiveGraceFrames = (this.inactiveGraceFrames || 0) + 1;
          if (this.inactiveGraceFrames > 10) {
            this.stillStartTimeMidSet = null;
            this.inactiveGraceFrames = 0;
          }
        } else {
          this.stillStartTimeMidSet = null;
          this.inactiveGraceFrames = 0;
        }
      }
    } else {
      // Manual exercise mode
      this.detectedExercise = selectedExercise.toLowerCase();
      this.isLocked = true;
      this.autoState = 'counting';
    }

    const effectiveExercise = isAuto ? this.detectedExercise : selectedExercise.toLowerCase();

    // 5. Evaluate rep counting for active exercise if in COUNTING state
    // Rep evaluation MUST run every frame so phase transitions and rep counting never freeze
    if (this.autoState === 'counting' || !isAuto) {
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

      // Only show resting countdown hint when user has been steady for >= 1.8s
      // This prevents the prompt from appearing so often during quick rep pauses
      if (isAuto && this.stillStartTimeMidSet !== null) {
        const stillDuration = (now - this.stillStartTimeMidSet) / 1000;
        if (stillDuration >= this.config.INACTIVITY_PROMPT_SECONDS) {
          const remaining = Math.max(0.1, this.config.INACTIVITY_SECONDS - stillDuration);
          this.feedback = `Resting... Stand still ${remaining.toFixed(1)}s to switch exercise`;
        }
      }
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
      autoState: this.autoState,
      isLocked: this.isLocked,
      holdProgress: this.holdProgress,
      exercise: effectiveExercise,
      detectedInfo,
      confidence: this.isLocked ? 100 : 95,
      exerciseStartedFormatted: this.exerciseStartedFormatted,
      exerciseActiveDurationSecs,
      reps: this.reps,
      phase: this.phase,
      formScore: this.formScore,
      formErrors: this.formErrors,
      feedback: this.feedback,
      angles,
      holdSeconds: this.holdSeconds,
      sessionTotals: { ...this.sessionExerciseReps },
    };
  }

  evaluateSquat(angles, landmarks) {
    const { knee, hip, torso } = angles;
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

    // State machine: ready/standing -> down -> bottom (<= 120°) -> standing (>= 148°)
    if (this.phase === 'ready' || this.phase === 'standing' || this.phase === 'up') {
      if (knee <= 120) {
        this.phase = 'bottom';
        cue = 'Great depth! Now drive up through heels';
      } else if (knee <= 135) {
        this.phase = 'down';
        cue = 'Sink hips lower...';
      }
    } else if (this.phase === 'down') {
      if (knee <= 120) {
        this.phase = 'bottom';
        cue = 'Great depth! Now drive up through heels';
      } else if (knee >= 145) {
        // Return to standing without hitting bottom depth
        this.phase = 'standing';
        cue = 'Squat lower: aim for parallel';
      }
    } else if (this.phase === 'bottom') {
      if (knee >= 148) {
        this.recordRep('squat');
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

    if (
      this.phase === 'ready' ||
      this.phase === 'top' ||
      this.phase === 'up' ||
      this.phase === 'standing'
    ) {
      if (elbow <= 125) {
        this.phase = 'down';
        cue = 'Lower chest to floor...';
      }
    } else if (this.phase === 'down') {
      if (elbow <= 110) {
        this.phase = 'bottom';
        cue = 'Full depth! Press the floor away';
      } else if (elbow >= 138) {
        this.phase = 'top';
      }
    } else if (this.phase === 'bottom') {
      if (elbow >= 140) {
        this.recordRep('pushup');
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
      this.sessionPlankSeconds = (this.sessionPlankSeconds || 0) + dt;
      this.sessionExerciseReps.plank = Math.floor(this.sessionPlankSeconds);
      cue = `Hold steady! ${Math.floor(this.holdSeconds)}s`;
    }

    this.formScore = Math.max(20, score);
    this.formErrors = errors;
    this.feedback = cue;
  }

  evaluateJumpingJack(_angles, landmarks) {
    const armsUp =
      landmarks[15].y <= landmarks[11].y + 0.08 || landmarks[16].y <= landmarks[12].y + 0.08;
    const feetDist = Math.abs(landmarks[27].x - landmarks[28].x);
    const hipDist = Math.abs(landmarks[23].x - landmarks[24].x);
    const armsSpreadWide = Math.abs(landmarks[15].x - landmarks[16].x) >= hipDist * 2.0;
    const baselineFeet = Math.max(0.12, this.baselinePose?.feetDist || 0.18);
    const feetWide = feetDist >= hipDist * 1.20 || feetDist >= baselineFeet * 1.20;

    if (this.phase === 'ready' || this.phase === 'closed' || this.phase === 'standing') {
      if ((armsUp || armsSpreadWide) && feetWide) {
        this.phase = 'open';
      }
    } else if (this.phase === 'open') {
      const armsDown =
        landmarks[15].y > landmarks[11].y + 0.04 && landmarks[16].y > landmarks[12].y + 0.04;
      const feetTogether =
        feetDist <= Math.max(baselineFeet * 1.35, hipDist * 1.25);
      if (armsDown && feetTogether) {
        this.recordRep('jumpingjack');
        this.phase = 'closed';
      }
    }

    this.formScore = 100;
    this.formErrors = [];
    this.feedback = 'Keep light on your toes and maintain tempo!';
  }

  evaluateBicepCurl(angles, landmarks) {
    const { leftElbow, rightElbow, torso } = angles;
    const errors = [];
    let score = 100;
    let cue = 'Curl smoothly, isolate biceps';

    if (torso > 22) {
      errors.push('torso_swing');
      score -= 30;
      cue = 'Stop swinging back; isolate arms';
    }

    const tLen = Math.max(0.1, this.torsoLength || 0.25);
    const leftWrist = landmarks?.[15];
    const leftElbowLm = landmarks?.[13];
    const leftShoulderLm = landmarks?.[11];
    const rightWrist = landmarks?.[16];
    const rightElbowLm = landmarks?.[14];
    const rightShoulderLm = landmarks?.[12];

    // Normalized Wrist-to-Shoulder Distance:
    // Curled (top of curl): Hand is at shoulder/chest -> wristDist <= 0.78
    // Extended (bottom of curl): Hand is at hip/thigh -> wristDist >= 1.05
    // This distance check is 100% immune to 2D angle noise/foreshortening!
    const leftWristDist = leftWrist && leftShoulderLm
      ? Math.hypot(leftWrist.x - leftShoulderLm.x, leftWrist.y - leftShoulderLm.y) / tLen
      : 1.2;
    const rightWristDist = rightWrist && rightShoulderLm
      ? Math.hypot(rightWrist.x - rightShoulderLm.x, rightWrist.y - rightShoulderLm.y) / tLen
      : 1.2;

    const leftWristUp = leftWrist && leftElbowLm ? leftWrist.y < leftElbowLm.y : true;
    const leftWristDown = leftWrist && leftElbowLm ? leftWrist.y > leftElbowLm.y + 0.03 : true;
    const leftCurled = (leftElbow || 180) <= 100 && leftWristDist <= 0.80 && leftWristUp;
    const leftExtended = (leftElbow || 0) >= 125 && leftWristDist >= 1.02 && leftWristDown;

    const rightWristUp = rightWrist && rightElbowLm ? rightWrist.y < rightElbowLm.y : true;
    const rightWristDown = rightWrist && rightElbowLm ? rightWrist.y > rightElbowLm.y + 0.03 : true;
    const rightCurled = (rightElbow || 180) <= 100 && rightWristDist <= 0.80 && rightWristUp;
    const rightExtended = (rightElbow || 0) >= 125 && rightWristDist >= 1.02 && rightWristDown;

    if (this.phase === 'ready' || this.phase === 'down' || this.phase === 'standing') {
      if (leftCurled || rightCurled) {
        this.curlFrames = (this.curlFrames || 0) + 1;
        if (this.curlFrames >= 2) {
          this.curlingArm = leftCurled && rightCurled ? 'both' : leftCurled ? 'left' : 'right';
          this.phase = 'curled';
          this.curlFrames = 0;
          this.extendFrames = 0;
          cue = 'Full squeeze at top!';
        }
      } else {
        this.curlFrames = 0;
      }
    } else if (this.phase === 'curled') {
      // While arm is stuck in curled/curved position:
      // wristDist is <= 0.80 and wrist is above elbow, so isExtended is STRICTLY FALSE!
      // Cannot count multiple reps while holding curled under any condition!
      let isExtended = false;
      if (this.curlingArm === 'left') {
        isExtended = leftExtended;
      } else if (this.curlingArm === 'right') {
        isExtended = rightExtended;
      } else {
        isExtended = leftExtended && rightExtended;
      }

      if (isExtended) {
        this.extendFrames = (this.extendFrames || 0) + 1;
        if (this.extendFrames >= 2) {
          this.recordRep('bicepcurl');
          this.phase = 'down';
          this.curlingArm = null;
          this.extendFrames = 0;
          this.curlFrames = 0;
          cue = 'Full extension. Rep counted!';
        }
      } else {
        this.extendFrames = 0;
      }
    }

    this.formScore = Math.max(20, score);
    this.formErrors = errors;
    this.feedback = cue;
  }
}
