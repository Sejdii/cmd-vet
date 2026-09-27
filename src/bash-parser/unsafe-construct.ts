const CHECKS = [hasCommandSubstitution, hasProcessSubstitution, isWhollyParenWrapped];

export function hasUnsafeConstruct(segment: string): boolean {
  return CHECKS.some((check) => check(segment));
}

function hasCommandSubstitution(segment: string): boolean {
  return segment.includes('$(') || segment.includes('`');
}

function hasProcessSubstitution(segment: string): boolean {
  return /[<>]\(/.test(segment);
}

function isWhollyParenWrapped(segment: string): boolean {
  if (!segment.startsWith('(') || !segment.endsWith(')')) return false;

  let depth = 0;
  for (let i = 0; i < segment.length; i += 1) {
    const char = segment[i];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0 && i !== segment.length - 1) return false;
    }
  }
  return depth === 0;
}
