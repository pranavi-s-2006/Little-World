// conversationData.js — living room conversation trees

export const CONVERSATION_TOPICS = [
  {
    id: 'day',
    question: 'How was your day?',
    responses: {
      happy:     { text: "It was wonderful! I had so much fun today~", social: 15, happiness: 8 },
      sad:       { text: "I'm feeling a little down today...", social: 10, happiness: 5 },
      tired:     { text: "I'm a bit tired, but I'm happy you're here!", social: 12, happiness: 6 },
      hungry:    { text: "It was okay, but I'm getting hungry now!", social: 10, happiness: 4 },
      default:   { text: "It was a pretty nice day! I enjoyed it~", social: 12, happiness: 6 },
    },
  },
  {
    id: 'feeling',
    question: 'How are you feeling right now?',
    responses: {
      happy:     { text: "I feel amazing! Everything is so lovely~", social: 12, happiness: 10 },
      sad:       { text: "I'm feeling a little lonely. I'm glad you asked.", social: 15, happiness: 8 },
      sick:      { text: "Not great... I think I need some rest.", social: 10, happiness: 5 },
      sleepy:    { text: "I'm getting sleepy... but I want to talk more!", social: 10, happiness: 5 },
      default:   { text: "I feel good! A little tired maybe, but happy~", social: 12, happiness: 7 },
    },
  },
  {
    id: 'favourite',
    question: 'What is your favourite thing to do?',
    responses: {
      default: { text: "I love drawing, reading and spending time with you! 💕", social: 14, happiness: 12 },
    },
  },
  {
    id: 'dream',
    question: 'What did you dream about?',
    responses: {
      sleeping: { text: "I dreamed about a garden full of flowers and butterflies~", social: 12, happiness: 10 },
      default:  { text: "I dreamed about a magical world where everything was pink and sparkly!", social: 12, happiness: 10 },
    },
  },
  {
    id: 'wish',
    question: 'What do you wish for today?',
    responses: {
      hungry:  { text: "I wish for something yummy to eat! 🍽️", social: 10, happiness: 6 },
      sad:     { text: "I wish we could spend more time together...", social: 15, happiness: 8 },
      default: { text: "I wish every day could be as lovely as today~", social: 12, happiness: 10 },
    },
  },
  {
    id: 'story',
    question: 'Tell me a story~',
    responses: {
      default: { text: "Once upon a time, a little girl lived in the most beautiful little world... and her guardian took care of her every day. The end! 💕", social: 18, happiness: 15 },
    },
  },
];

export function getConversationResponse(topic, characterState) {
  const responses = topic.responses;
  return responses[characterState] ?? responses.default ?? responses[Object.keys(responses)[0]];
}
