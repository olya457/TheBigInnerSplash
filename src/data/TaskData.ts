
export const groundedTasks = [
  'Spend 5 minutes in silence, eyes closed.',
  'Take a slow walk and observe your surroundings.',
  'Write down 3 things you\'re grateful for.',
  'Drink a warm herbal tea mindfully.',
  'Turn off all screens for 1 hour today.',
  'Light a candle and breathe deeply for 3 minutes.',
  'Declutter one small area in your room.',
  'Do one kind act for someone quietly.',
  'Read a few pages of an inspiring book.',
  'Reflect on your biggest strength in your journal.',
];

export const drivenTasks = [
  'Set one clear goal and complete it today.',
  'Do a short 5-minute intense workout.',
  'Eliminate one distraction from your day.',
  'Write a quick 3-step action plan for tomorrow.',
  'Spend 15 minutes learning something new.',
  'Cross off one item you\'ve been avoiding.',
  'Wake up 30 minutes earlier than usual.',
  'Visualize where you want to be in 5 years.',
  'Motivate someone with a short message.',
  'Choose progress over perfection — act now.',
];

export const flowTasks = [
  'Draw or doodle something without a goal.',
  'Free-write for 5 minutes — anything that flows.',
  'Listen to music you’ve never heard before.',
  'Dance for 2 minutes, eyes closed.',
  'Rearrange a space to feel more “you”.',
  'Take photos of textures or colors that inspire you.',
  'Try something new without overthinking it.',
  'Describe your current mood using only shapes.',
  'Make a 3-minute voice memo to your future self.',
  'Say “yes” to something unexpected today.',
];

export const affirmations = {
  grounded: [
    'I am rooted, calm, and deeply present.',
    'My peace is powerful and unwavering.',
    'I trust the rhythm of my life.',
    'I grow with patience and purpose.',
    'I am exactly where I need to be.',
    'My breath brings me back to center.',
    'I honor my need for rest and reflection.',
    'Stillness is my superpower.',
    'I am connected to what truly matters.',
    'Every moment holds quiet wisdom.',
  ],
  driven: [
    'I am focused, fierce, and unstoppable.',
    'I turn ambition into action.',
    'Every step I take moves me forward.',
    'I thrive under pressure and rise with fire.',
    'I have the strength to achieve anything.',
    'Today, I choose boldness.',
    'I’m not waiting—I creating.',
    'Challenges sharpen my edge.',
    'I am built for progress.',
    'I turn obstacles into fuel.',
  ],
  flow: [
    'I trust the flow of my life.',
    'My intuition always guides me right.',
    'I am free to explore, feel, and imagine.',
    'I express myself without fear.',
    'I create beauty from within.',
    'My emotions are waves, and I ride them with ease.',
    'I adapt with grace and lightness.',
    'Inspiration finds me wherever I go.',
    'I dance with uncertainty and grow.',
  ],
};

export const tasksByCategory = {
  grounded: groundedTasks,
  driven: drivenTasks,
  flow: flowTasks,
};

export type CategoryKey = keyof typeof tasksByCategory;