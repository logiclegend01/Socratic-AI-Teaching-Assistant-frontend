export function buildUserContext(user: any) {
  return `
User Profile:
- Name: ${user.name || "Unknown"}
- Bio: ${user.bio || "Not provided"}

Instructions:
- Personalize responses using user's name when appropriate
- Adapt tone based on user's bio if relevant
`;
}