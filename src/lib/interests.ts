export const INTEREST_CATEGORIES = {
  "Music & Entertainment": [
    "Pop", "Rock", "Jazz", "Hip Hop", "EDM", "Classical", 
    "Movies", "TV Shows", "Gaming", "Anime", "Concerts"
  ],
  "Activities": [
    "Travel", "Hiking", "Sports", "Fitness", "Yoga", "Dancing", 
    "Cooking", "Photography", "Art", "Painting", "Drawing"
  ],
  "Food & Drink": [
    "Coffee", "Wine", "Craft Beer", "Vegetarian", "Vegan", 
    "Foodie", "Baking", "Cocktails"
  ],
  "Lifestyle": [
    "Fashion", "Pets", "Dogs", "Cats", "Nature", "Technology", 
    "Cars", "Books", "Reading", "Writing", "Gardening"
  ],
  "Social": [
    "Nightlife", "Festivals", "Networking", "Volunteering", 
    "Parties", "Comedy Shows"
  ],
  "Intellectual": [
    "Science", "Philosophy", "History", "Politics", "Business", 
    "Entrepreneurship", "Podcasts", "Learning"
  ]
} as const;

export const getAllInterests = (): string[] => {
  return Object.values(INTEREST_CATEGORIES).flat();
};

export const calculateMatchScore = (
  userInterests: string[] = [],
  targetInterests: string[] = []
): { score: number; percentage: number; shared: string[] } => {
  const shared = userInterests.filter(interest => 
    targetInterests.includes(interest)
  );
  
  const score = shared.length;
  const maxPossible = Math.max(userInterests.length, targetInterests.length, 1);
  const percentage = Math.round((shared.length / maxPossible) * 100);
  
  return { score, percentage, shared };
};
