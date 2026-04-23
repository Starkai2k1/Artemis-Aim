export const calculateScore = (x, y) => {
  const distance = Math.sqrt(x * x + y * y);
  if (distance > 1) return 'M';
  let score = Math.ceil(10 - (distance * 10));
  if (score === 0) score = 1;
  if (score < 0) return 'M';
  return score;
};

export const calculateSessionStats = (passes) => {
  const allArrows = passes.flat();
  const totalScore = allArrows.reduce((sum, arrow) => sum + (arrow.score === 'M' ? 0 : arrow.score), 0);
  const average = allArrows.length > 0 ? totalScore / allArrows.length : 0;
  
  return { totalScore, average, arrowCount: allArrows.length };
};
