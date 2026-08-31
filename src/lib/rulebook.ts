export interface RuleSection {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string[];
}

export const RULEBOOK_SECTIONS: RuleSection[] = [
  {
    id: 'intro',
    title: '1. What is CityMint?',
    category: 'Getting Started',
    summary: 'Introduction to the smart hybrid board game.',
    content: [
      'Step 1: CityMint combines a physical square board game with a single digital Banker web app.',
      'Step 2: One phone or tablet acts as the digital Banker to automatically track cash, property ownership, rent levels, and match history.',
      'Step 3: Players do NOT need individual app accounts — the banker scans physical card QR codes on their behalf.',
      'Step 4: Roll physical dice, move physical tokens on the board, and let the Banker app handle all calculations.'
    ]
  },
  {
    id: 'setup',
    title: '2. Game Setup & Registration',
    category: 'Getting Started',
    summary: 'How to register players and start a match.',
    content: [
      'Step 1: Open "New Game Setup" on the Banker app.',
      'Step 2: Select 2, 3, or 4 players and assign player names and token colors.',
      'Step 3: Scan each player\'s physical Player QR card to link their digital profile.',
      'Step 4: Each player starts with ₹1,500 initial cash capital.'
    ]
  },
  {
    id: 'turns',
    title: '3. Taking Your Turn',
    category: 'Gameplay',
    summary: 'The standard turn order and banker controls.',
    content: [
      'Step 1: Roll physical dice and move your token clockwise on the physical board.',
      'Step 2: The Banker checks the active turn player shown on screen.',
      'Step 3: Scan the QR code of the tile or card you land on (Property, Teleport, Start, or Action Card).',
      'Step 4: Once all transactions are resolved, tap "End Turn" to pass the turn to the next player.'
    ]
  },
  {
    id: 'buying',
    title: '4. Buying Properties & Live Auctions',
    category: 'Properties',
    summary: 'How to buy unowned cities or launch live bidding auctions.',
    content: [
      'Step 1: When landing on an unowned property, scan its Property QR code on the Banker app.',
      'Step 2: Tap "Buy Property" to purchase it at its base price (e.g. ₹2,600). Cash is debited and ownership assigned.',
      'Step 3: If you pass on buying at base price, tap "Auction Property 🔨" to launch a 15-second live bidding auction!',
      'Step 4: All active players bid cash in ₹100 / ₹500 increments. Tapping in the last 3 seconds adds +5s to the clock. High bidder wins the property!'
    ]
  },
  {
    id: 'rent',
    title: '5. Rent, Monopoly Sets & Upgrades',
    category: 'Properties',
    summary: 'Rent calculations, set completion bonuses, and level 1-5 upgrades.',
    content: [
      'Step 1: Landing on an owned property requires paying rent to the owner (Rent = Base Rent × Level Multiplier).',
      'Step 2: Multipliers: Level 1 = 1.00×, Level 2 = 1.40×, Level 3 = 1.80×, Level 4 = 2.50×, Level 5 (MAX) = 3.50×.',
      'Step 3: Monopoly Set Bonus: When a SINGLE player owns ALL properties in a color group, all properties in that set automatically upgrade to Level 2 (1.40× rent)!',
      'Step 4: Property Upgrades: Owners can inspect their property and tap "Upgrade Level" (cost = Base Rent × 5) to manually increase levels up to Level 5.'
    ]
  },
  {
    id: 'jail',
    title: '6. Jail Rules & Escaping',
    category: 'Special Spaces',
    summary: 'Entering jail, rent blocks, and auto-bail rules.',
    content: [
      'Step 1: You go to Jail by landing on "Go To Jail", scanning a Jail QR, or playing a Police Raid card.',
      'Step 2: Rent Freeze: Players in Jail CANNOT collect rent from tenants on any of their properties!',
      'Step 3: Escaping: On your turn, tap "Pay Bail ₹500" or tap "Use Pardon Card" to get released immediately.',
      'Step 4: Auto-Bail: If you remain in Jail for 3 full turns, the app automatically debits ₹500 bail and releases you.'
    ]
  },
  {
    id: 'teleport',
    title: '7. Teleportation & Start Rewards',
    category: 'Special Spaces',
    summary: 'Warping across the board and passing Start.',
    content: [
      'Step 1: Landing on a Teleport space prompts a ₹500 fee. If paid, warp your token to any unowned property or tile on the board.',
      'Step 2: Passing or landing on START awards a fixed ₹2,000 salary from the Bank.',
      'Step 3: Tap "⚡ Pass Start (+₹2k)" on the Banker dashboard to credit salary instantly.'
    ]
  },
  {
    id: 'debt',
    title: '8. Debt Settlement & Selling Properties',
    category: 'Bankruptcy',
    summary: 'Handling shortfalls and selling assets.',
    content: [
      'Step 1: If a rent or tax payment exceeds your available cash, the app enters Debt Settlement Mode.',
      'Step 2: Select properties to sell back to the Bank for half of their total calculated asset value.',
      'Step 3: If selling properties covers the shortfall, debt resolves and gameplay continues.',
      'Step 4: If debt cannot be satisfied even after selling all properties, the player declares Bankruptcy and is eliminated.'
    ]
  },
  {
    id: 'winning',
    title: '9. Winning the Game',
    category: 'Winning',
    summary: 'Net worth calculations and champion declaration.',
    content: [
      'Step 1: The game ends when all competitors go bankrupt or when the banker taps "End Game".',
      'Step 2: Winner is ranked by Net Worth = Cash + Property Asset Valuations.',
      'Step 3: Property Valuation = Purchase Price + (Level - 1) × (Base Rent × 5). Upgrading properties increases your net worth!',
      'Step 4: View the interactive Victory Overlay for Net Worth graphs, MVP Landlord awards, and match highlights.'
    ]
  }
];

export function searchRulebook(query: string): RuleSection[] {
  const q = query.toLowerCase().trim();
  if (!q) return RULEBOOK_SECTIONS;

  return RULEBOOK_SECTIONS.filter((section) => {
    return (
      section.title.toLowerCase().includes(q) ||
      section.category.toLowerCase().includes(q) ||
      section.summary.toLowerCase().includes(q) ||
      section.content.some((p) => p.toLowerCase().includes(q))
    );
  });
}
