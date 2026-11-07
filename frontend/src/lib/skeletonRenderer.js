/**
 * High-Visibility MediaPipe Skeleton & Joint Renderer
 * Renders prominent joint nodes, glowing kinetic bones, and real-time angle overlays.
 */

export const POSE_CONNECTIONS = [
  // Torso Core
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left Arm
  [11, 13], [13, 15],
  // Right Arm
  [12, 14], [14, 16],
  // Left Leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right Leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
  // Shoulders to Nose / Head
  [0, 11], [0, 12]
];

// Key anatomical joints to render with prominent glow & radius
export const KEY_JOINTS = {
  11: 'L_SHOULDER', 12: 'R_SHOULDER',
  13: 'L_ELBOW',    14: 'R_ELBOW',
  15: 'L_WRIST',    16: 'R_WRIST',
  23: 'L_HIP',      24: 'R_HIP',
  25: 'L_KNEE',     26: 'R_KNEE',
  27: 'L_ANKLE',    28: 'R_ANKLE'
};

export function drawPoseSkeleton(ctx, landmarks, width, height, options = {}) {
  if (!ctx || !landmarks || landmarks.length < 33) return;

  const {
    isMirrored = true,
    hasError = false,
    angles = {},
    activeExercise = 'squat',
    showAngles = true
  } = options;

  const primaryColor = hasError ? '#ef4444' : '#ea580c'; // Vibrant Red or BurnIt Orange
  const secondaryColor = hasError ? '#f87171' : '#f97316';
  const jointFill = '#ffffff';

  ctx.save();

  // Helper: map normalized landmark (0-1) to canvas pixel coordinates
  const toPixel = (lm) => {
    let x = lm.x * width;
    if (isMirrored) {
      x = width - x;
    }
    const y = lm.y * height;
    return { x, y, vis: lm.visibility !== undefined ? lm.visibility : 1.0 };
  };

  // 1. Draw glowing skeletal bones
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = primaryColor;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 10;

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const p1 = toPixel(landmarks[startIdx]);
    const p2 = toPixel(landmarks[endIdx]);

    if (p1.vis > 0.4 && p2.vis > 0.4) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // 2. Draw prominent visible joint nodes
  for (let i = 0; i < landmarks.length; i++) {
    // Skip facial landmarks 1-10, keep nose 0 and major joints
    if (i > 0 && i < 11) continue;

    const p = toPixel(landmarks[i]);
    if (p.vis <= 0.4) continue;

    const isMajor = KEY_JOINTS[i] !== undefined;
    const outerRadius = isMajor ? 10 : 6;
    const innerRadius = isMajor ? 5 : 3;

    // Outer glowing halo
    ctx.beginPath();
    ctx.arc(p.x, p.y, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = hasError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 88, 12, 0.4)';
    ctx.fill();

    // Joint stroke border
    ctx.beginPath();
    ctx.arc(p.x, p.y, outerRadius - 2, 0, 2 * Math.PI);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();

    // Solid inner core
    ctx.beginPath();
    ctx.arc(p.x, p.y, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = jointFill;
    ctx.shadowBlur = 0;
    ctx.fill();
  }

  // 3. Render real-time angle badge overlays directly next to target joints
  if (showAngles && angles) {
    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px Inter, system-ui, -apple-system, sans-serif';

    const drawAngleTag = (p, text) => {
      if (!p || p.vis <= 0.4) return;
      const tagW = 54;
      const tagH = 22;
      const tagX = p.x + 12 > width - tagW ? p.x - tagW - 12 : p.x + 12;
      const tagY = p.y - 11;

      ctx.fillStyle = 'rgba(15, 15, 22, 0.88)';
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${text}°`, tagX + tagW / 2, tagY + tagH / 2);
    };

    if (activeExercise === 'squat' && angles.knee) {
      const kneeLm = toPixel(landmarks[26]); // Right knee
      drawAngleTag(kneeLm, angles.knee);
    } else if ((activeExercise === 'pushup' || activeExercise === 'bicepcurl') && angles.elbow) {
      const elbowLm = toPixel(landmarks[14]); // Right elbow
      drawAngleTag(elbowLm, angles.elbow);
    } else if (activeExercise === 'plank' && angles.hip) {
      const hipLm = toPixel(landmarks[24]); // Right hip
      drawAngleTag(hipLm, angles.hip);
    }
  }

  ctx.restore();
}

export function drawWorkoutHUD(ctx, width, height, data = {}) {
  if (!ctx) return;

  const {
    feedback = '',
    bodyVisible = true,
    formScore = 100,
  } = data;

  ctx.save();

  // 1. Position warning overlay if whole body is out of frame
  if (!bodyVisible) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Step Into Camera Frame', width / 2, height / 2 - 12);

    ctx.fillStyle = '#ea580c';
    ctx.font = '500 14px Inter, system-ui, sans-serif';
    ctx.fillText('Position your shoulders, hips, and knees clearly in view', width / 2, height / 2 + 18);
    ctx.restore();
    return;
  }

  // 2. High-Contrast Coaching Banner (Bottom Center)
  // Only shows helpful coaching corrections without cluttering the view with duplicate reps/time
  if (feedback) {
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    const textWidth = ctx.measureText(feedback).width;
    const bannerW = Math.max(textWidth + 48, 240);
    const bannerH = 42;
    const bannerX = (width - bannerW) / 2;
    const bannerY = height - 58;

    ctx.fillStyle = formScore < 80 ? 'rgba(239, 68, 68, 0.92)' : 'rgba(14, 14, 20, 0.9)';
    ctx.strokeStyle = formScore < 80 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(234, 88, 12, 0.5)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 21);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(feedback, width / 2, bannerY + 26);
  }

  ctx.restore();
}
