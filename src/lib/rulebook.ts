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
      'Step 1: CityMint combines a physical board game with a single digital Banker web app.',
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
      'Step 4: Each player starts with ₹10,000 initial cash capital.'
    ]
  },
  {
    id: 'turns',
    title: '3. Taking Your Turn & Turn Switches',
    category: 'Gameplay',
    summary: 'Standard turn order, banker controls, and player card scans.',
    content: [
      'Step 1: Roll physical dice and move your token clockwise on the physical board.',
      'Step 2: Scan the QR code of the tile or card you land on (Property, Teleport, Start, or Action Card).',
      'Step 3: Player Card Scan: Scanning a physical Player QR Card instantly switches the active turn to that player and auto-scrolls the top strip.',
      'Step 4: Tap "End Turn" on the bottom bar to advance turn to the next player. A confirmation toast confirms turn transitions.'
    ]
  },
  {
    id: 'buying',
    title: '4. Buying Properties & Live Auctions',
    category: 'Properties',
    summary: 'How to buy unowned cities or launch live bidding auctions.',
    content: [
      'Step 1: When landing on an unowned property, scan its Property QR code on the Banker app.',
      'Step 2: Tap "Buy Property" to purchase it at its base price (e.g. ₹1,400). Cash is debited and ownership assigned.',
      'Step 3: If cash is insufficient, a warning toast appears: "⚠️ Insufficient Balance!".',
      'Step 4: If you pass on buying at base price, tap "Auction Property 🔨" to launch a 15-second live bidding auction! All active players bid cash in ₹100 / ₹500 increments.'
    ]
  },
  {
    id: 'rent',
    title: '5. Rent, Monopoly Sets & Free Self-Landing Upgrades',
    category: 'Properties',
    summary: 'Rent calculations, set completion bonuses, and free self-landing upgrades.',
    content: [
      'Step 1: Landing on an opponent\'s property requires paying rent (Rent = Base Rent × Level Multiplier).',
      'Step 2: Rent Multipliers: Level 1 = 1.00×, Level 2 = 1.40×, Level 3 = 1.80×, Level 4 = 2.50×, Level 5 (MAX) = 3.50×.',
      'Step 3: Monopoly Set Bonus: When a SINGLE player owns ALL properties in a color group, all properties in that set automatically upgrade to Level 2 (1.40× rent)!',
      'Step 4: Free Self-Landing Upgrade: When landing on your OWN property, you receive a FREE +1 Level Upgrade (up to Level 5 max) at no extra cost!'
    ]
  },
  {
    id: 'jail',
    title: '6. Jail Rules & Escaping',
    category: 'Special Spaces',
    summary: 'Entering jail, rent blocks, and bail rules.',
    content: [
      'Step 1: You go to Jail by landing on "Go To Jail", scanning a Jail QR, or playing a Police Raid card.',
      'Step 2: Rent Freeze: Players in Jail CANNOT collect rent from tenants on any of their properties!',
      'Step 3: Escaping: On your turn, tap "Pay Bail ₹500" or tap "Use Pardon Card" to get released immediately.',
      'Step 4: Auto-Bail: If you remain in Jail for 3 full turns, the app automatically debits ₹500 bail and releases you.'
    ]
  },
  {
    id: 'teleport',
    title: '7. Teleportation & Pass Start Rewards',
    category: 'Special Spaces',
    summary: 'Warping across the board and salary confirmation.',
    content: [
      'Step 1: Landing on a Teleport space prompts a ₹500 fee. If paid, warp your token to any unowned property or tile on the board.',
      'Step 2: Passing or landing on START awards a fixed ₹2,000 salary from the Bank.',
      'Step 3: Tap "⚡ Pass Start (+₹2k)" on the Banker dashboard. A confirmation popup appears before crediting ₹2,000 salary to prevent accidental taps.'
    ]
  },
  {
    id: 'debt',
    title: '8. Debt Settlement, 100% Refunds & Direct Transfers',
    category: 'Bankruptcy',
    summary: '100% property liquidation value and player-to-player property transfers.',
    content: [
      'Step 1: If a rent or fee payment exceeds available cash, the app enters Debt Settlement Mode.',
      'Step 2: 100% Refund Sale: Selling properties to the Bank refunds 100% of the original purchase price (no 50% penalty!).',
      'Step 3: Direct Player Transfer: When owing debt to another player, properties can be transferred directly to the creditor player to credit purchase price toward debt without losing cash.',
      'Step 4: If debt cannot be satisfied after liquidating all assets, the player declares Bankruptcy and is eliminated (marked with a red 🚫 BANKRUPT badge).'
    ]
  },
  {
    id: 'activity_and_tools',
    title: '9. Activity Feed, Logs & In-App QR Directory',
    category: 'In-App Tools',
    summary: 'Inspecting event details, exporting CSV, and viewing QR codes.',
    content: [
      'Step 1: Activity Feed: Fixed top header with Export CSV button and scrollable event history list.',
      'Step 2: Event Details: Tapping any log entry opens a detailed breakdown showing who paid whom, amount transferred, and property details.',
      'Step 3: QR Cards Directory: Tapping "QR Cards" in header opens an in-app directory to view, search, and scan any QR card instantly without leaving the game or triggering splash screens.'
    ]
  },
  {
    id: 'winning',
    title: '10. Winning the Game & Victory Celebration',
    category: 'Winning',
    summary: 'Net worth ranking, multi-burst confetti, and match analytics.',
    content: [
      'Step 1: The game ends when all competitors go bankrupt or when the banker taps "End Game".',
      'Step 2: Winner is ranked by Net Worth = Cash Balance + Property Asset Valuations.',
      'Step 3: Victory Celebration: Ending a game triggers a multi-burst confetti cannon celebration featuring the champion\'s custom avatar colors!',
      'Step 4: View the interactive Victory Overlay for turn-by-turn Net Worth progression graphs and MVP Landlord awards.'
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
