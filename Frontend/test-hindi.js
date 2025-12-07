// Quick test for Romanized Hindi detection
function containsRomanizedHindi(text) {
  const romanizedHindiWords = [
    /\bmujhe\b/i, /\bkuchh?\b/i, /\bkaisa\b/i, /\bhai\b/i, /\bho\b/i,
    /\brah[aei]\b/i, /\bkar[oen]\b/i, /\bki[ya]?\b/i, /\bka\b/i, /\bke\b/i,
    /\bko\b/i, /\bse\b/i, /\bme\b/i, /\bpar\b/i, /\bhain\b/i, /\bhu\b/i,
    /\bhum\b/i, /\btum\b/i, /\btu\b/i, /\byeh\b/i, /\bwoh\b/i,
    /\bkaha[nt]?\b/i, /\bkya\b/i, /\bkyon\b/i, /\bkab\b/i, /\bkaise\b/i,
    /\bkitn[aei]\b/i, /\bchahiy[ae]\b/i, /\bdijiy[ae]\b/i, /\bla[ao]\b/i,
    /\bja[ao]\b/i, /\bdekh[no]\b/i, /\bsun[no]\b/i, /\bbata[no]\b/i,
    /\bsamajh[no]\b/i, /\bkar[no]\b/i, /\bmat\b/i, /\bna\b/i, /\bnhi\b/i,
    /\bhog[aei]\b/i, /\bth[aei]\b/i
  ];

  const lowerText = text.toLowerCase();
  return romanizedHindiWords.some(pattern => pattern.test(lowerText));
}

function detectSpeechLanguage(text) {
  // Check for Devanagari script first
  const containsHindiChars = /[\u0900-\u097F]/.test(text);
  const containsGujaratiChars = /[\u0A80-\u0AFF]/.test(text);

  // Check for Romanized Hindi words
  const containsRomanizedHindiWords = containsRomanizedHindi(text);

  // If text contains Devanagari, Gujarati, or Romanized Hindi words, use Hindi
  if (containsHindiChars || containsGujaratiChars || containsRomanizedHindiWords) {
    return 'hi';
  }

  // Default to English
  return 'en';
}

console.log('Testing Romanized Hindi detection:');
console.log('Input: mujhe kuchh problem ho rahi hai');
console.log('containsRomanizedHindi:', containsRomanizedHindi('mujhe kuchh problem ho rahi hai'));
console.log('detectSpeechLanguage:', detectSpeechLanguage('mujhe kuchh problem ho rahi hai'));
console.log('');

console.log('Input: I have some problem');
console.log('containsRomanizedHindi:', containsRomanizedHindi('I have some problem'));
console.log('detectSpeechLanguage:', detectSpeechLanguage('I have some problem'));
console.log('');

console.log('Input: नमस्ते, मैं आपकी मदद कर सकता हूँ');
console.log('containsRomanizedHindi:', containsRomanizedHindi('नमस्ते, मैं आपकी मदद कर सकता हूँ'));
console.log('detectSpeechLanguage:', detectSpeechLanguage('नमस्ते, मैं आपकी मदद कर सकता हूँ'));







