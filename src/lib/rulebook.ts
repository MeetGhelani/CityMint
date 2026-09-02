export interface RuleSection {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string[];
}

export interface AppGuideStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  keyActions: string[];
  bankerTip: string;
}

export interface ActionCardRule {
  id: string;
  code: string;
  name: string;
  category: 'Money' | 'Property' | 'Jail' | 'Movement' | 'Special';
  summary: string;
  effect: string;
}

export const RULEBOOK_SECTIONS: RuleSection[] = [
  {
    id: 'intro',
    title: '1. What is CityMint?',
    category: 'Getting Started',
    summary: 'Introduction to the smart hybrid physical & digital board game.',
    content: [
      'Step 1: CityMint combines a physical board game with a single digital Banker web app.',
      'Step 2: One phone or tablet acts as the Banker device to automatically track cash balances, property ownership, rent multipliers, and match logs.',
      'Step 3: Players do NOT need individual app accounts — the Banker scans physical card QR codes on their behalf.',
      'Step 4: Roll physical dice, move physical tokens on the board, and let the Banker app handle all math, auctions, and rent calculations!'
    ]
  },
  {
    id: 'setup',
    title: '2. Game Setup & Player Registration',
    category: 'Getting Started',
    summary: 'How to register 2 to 4 players and start a match.',
    content: [
      'Step 1: Tap "New Game Setup" on the Banker app landing page.',
      'Step 2: Select 2, 3, or 4 players and assign player names and custom color tokens.',
      'Step 3: Scan each player\'s physical Player QR card to pair their physical card with their digital bank profile.',
      'Step 4: Each player starts with ₹10,000 initial cash capital in their bank account.'
    ]
  },
  {
    id: 'turns',
    title: '3. Taking Turns & Quick Turn Switching',
    category: 'Gameplay',
    summary: 'Standard turn sequence, banker controls, and Player QR card scans.',
    content: [
      'Step 1: Roll physical dice and move your token clockwise on the physical game board.',
      'Step 2: Scan the physical QR code of the property, special tile, or Action Card you land on.',
      'Step 3: Quick Turn Switch: Scanning any physical Player QR Card instantly switches the active turn to that player and highlights their profile in the top scoreboard strip.',
      'Step 4: Tap "End Turn" on the bottom action bar to advance turn to the next player. A toast notification confirms turn transitions.'
    ]
  },
  {
    id: 'buying_and_auctions',
    title: '4. Buying Properties, 20s Auctions & Direct Sales',
    category: 'Properties',
    summary: 'Purchasing unowned cities, 20-second bidding timer, and fallback direct sales.',
    content: [
      'Step 1: When landing on an unowned property, scan its Property QR code on the Banker app.',
      'Step 2: Tap "Buy Property" to purchase it at its base valuation price (e.g., ₹1,400). Cash is debited and ownership assigned.',
      'Step 3: Live 20s Bidding Auction 🔨: If the player passes on buying at base price, tap "Auction Property" to start a 20-second live auction! All active players can raise bids in ₹100 or ₹500 increments. Web Audio beeps tick from 10s down to 1s with an urgency tone.',
      'Step 4: No-Bid Direct Sale / Pass Fallback: If 0s is reached with NO bids raised, the Banker enters Direct Sale Mode — allowing the Banker to sell directly to any chosen player at a negotiated price or pass the property unowned.'
    ]
  },
  {
    id: 'rent_inspection',
    title: '5. Checking Rent Rates & Rent Calculations',
    category: 'Properties',
    summary: 'Inspecting property rent rates without paying, CityMint set bonuses, and free upgrades.',
    content: [
      'Step 1: Inspect Rent Info Without Paying 🔍: If any player wants to check the current rent level, base rent, or upgrade price of a property, tell the Banker to scan its Property QR code. The app displays full property details, rent breakdown, and level multiplier. The Banker can simply inspect the info and tap the Close button (✕) without clicking "Pay Rent" or "Buy Property"!',
      'Step 2: Rent Multipliers: Level 1 = 1.00×, Level 2 = 1.40×, Level 3 = 1.80×, Level 4 = 2.50×, Level 5 (MAX) = 3.50×.',
      'Step 3: CityMint Set Auto-Upgrade 🎉: When a player buys or wins the FINAL missing property to complete a color set (e.g., acquiring the 3rd of 3 cities in a group), ALL properties in that color group automatically receive a +1 Level Upgrade (up to Level 5 max) and the LATEST activity banner announces the set completion and level upgrades!',
      'Step 4: Free Self-Landing Upgrade: When landing on your OWN property, you receive a FREE +1 Level Upgrade (up to Level 5 max) at zero cost!'
    ]
  },
  {
    id: 'action_cards',
    title: '6. Action Cards System (30 Cards)',
    category: 'Action Cards',
    summary: 'Scanning Action Cards, non-monetary effects, and targeted actions.',
    content: [
      'Step 1: When landing on an "Action Card" board space, draw a physical Action Card (Cards 1 to 30).',
      'Step 2: Scan the card\'s Action QR code (e.g. CM-ACTION-21) on the Banker app.',
      'Step 3: Interactive Selection & Dropdowns 🎯: For targeted cards (Eminent Domain, Property Downgrade, Title Deed Seizure, Property Swap, Police Raid), the Banker App opens interactive dropdowns to select target opponents and specific properties.',
      'Step 4: Dynamic Level & Threshold Fallbacks ⚡: If exact conditions are unavailable (e.g., no Level 1 properties for Title Deed Seizure or no 3+ property opponents for Property Downgrade), the app dynamically adapts to the next available level/threshold (Level 2+, 2+ or 1+ properties).',
      'Step 5: Tie-Breaking Rules 🏆: Whenever multiple candidate properties share the same highest or lowest level, ties are deterministically broken by choosing the property with the highest base purchase price.',
      'Step 6: Categories include Money (Tax Refund, Birthday Bash), Property (Eminent Domain, Renovation Collapse, Property Downgrade), Jail (Police Raid, Pardons), Movement (Express Highway, Metro Express, Reverse Detour), and Special (Title Deed Seizure, Rent Immunity Shield).'
    ]
  },
  {
    id: 'jail',
    title: '7. Jail Rules, Rent Freeze & Escaping',
    category: 'Special Spaces',
    summary: 'Jail entry conditions, rent freeze restrictions, and bail options.',
    content: [
      'Step 1: You go to Jail by landing on "Go To Jail", scanning a Jail QR, or being targeted by a Police Raid or Curfew Warrant card.',
      'Step 2: Rent Freeze: Players in Jail CANNOT collect rent from opponents on any of their properties while imprisoned!',
      'Step 3: Escaping Jail: On your turn, tap "Pay Bail ₹500" or play a "Pardon Card" to get released immediately.',
      'Step 4: Auto-Bail: If you remain in Jail for 3 full turns, the app automatically debits ₹500 bail and releases your token.'
    ]
  },
  {
    id: 'teleport_start',
    title: '8. Teleport Hub & Pass Start Salary',
    category: 'Special Spaces',
    summary: 'Warping across the board and salary confirmation popups.',
    content: [
      'Step 1: Landing on Teleport Hub prompts a ₹500 teleport fee. Once paid, warp your token to any space on the board.',
      'Step 2: Passing or landing on START awards a fixed ₹2,000 salary from the Bank.',
      'Step 3: Tap "⚡ Pass Start (+₹2k)" on the Banker dashboard. A confirmation modal prevents accidental double taps.'
    ]
  },
  {
    id: 'debt_liquidation',
    title: '9. Debt Settlement, 100% Refunds & Direct Property Transfers',
    category: 'Bankruptcy',
    summary: '100% purchase price liquidation value and creditor property transfers.',
    content: [
      'Step 1: If a rent or fee payment exceeds a player\'s available cash balance, the Banker app triggers Debt Settlement Mode.',
      'Step 2: 100% Refund Property Sale: Selling properties back to the Bank refunds 100% of their original purchase price (no 50% penalty!).',
      'Step 3: Direct Creditor Property Transfer: When owing rent debt to an opponent, properties can be transferred directly to the creditor player to offset debt balance without losing cash.',
      'Step 4: If debt cannot be satisfied after liquidating all assets, the player declares Bankruptcy and is eliminated with a red 🚫 BANKRUPT badge.'
    ]
  },
  {
    id: 'banker_tools',
    title: '10. Activity Feed, Log Details & Undo System',
    category: 'In-App Tools',
    summary: 'Inspecting event details, manual cash adjustments, and transaction undo.',
    content: [
      'Step 1: Activity Feed: The live transaction header logs every rent, purchase, upgrade, and action card event.',
      'Step 2: Event Details Modal: Tapping any log entry opens a detailed modal showing exact payer, receiver, amount, and property specs.',
      'Step 3: Undo Last Action: Tap "Undo" on the top header to reverse accidental transactions or wrong scans.',
      'Step 4: Manual Adjustments: Banker can manually credit or debit cash for custom rule adjustments or bank loans.'
    ]
  },
  {
    id: 'winning',
    title: '11. Winning the Game & Victory Celebration',
    category: 'Winning',
    summary: 'Net worth ranking, confetti cannons, and match analytics.',
    content: [
      'Step 1: The match ends when all competitors go bankrupt or when the Banker taps "End Game".',
      'Step 2: Winner Ranking: Champion is ranked by Net Worth = Cash Balance + Total Property Asset Valuations.',
      'Step 3: Victory Celebration: Finishing a match launches a multi-burst confetti cannon celebration with the winner\'s avatar colors!',
      'Step 4: View the Victory Overlay for net worth progression charts and MVP Landlord awards.'
    ]
  }
];

export const APP_GUIDE_STEPS: AppGuideStep[] = [
  {
    id: 'app-1',
    stepNumber: 1,
    title: 'New Game Setup',
    subtitle: 'Registering players & pairing physical QR cards',
    icon: '🎮',
    description: 'Launch CityMint on any tablet or smartphone acting as the Banker device.',
    keyActions: [
      'Tap "New Game Setup" on the home page.',
      'Select 2, 3, or 4 players.',
      'Assign player names and pick token avatar colors.',
      'Scan physical Player QR cards to pair each player\'s card with their digital profile.'
    ],
    bankerTip: 'Make sure all physical Player QR cards are distributed to players before starting!'
  },
  {
    id: 'app-2',
    stepNumber: 2,
    title: 'Dashboard & Turn Switching',
    subtitle: 'Managing active turns and player scoreboards',
    icon: '⚡',
    description: 'The top scoreboard strip displays live cash balances and property counts for all active players.',
    keyActions: [
      'Scan a player\'s physical Player QR card to switch the active turn instantly.',
      'Alternatively, tap any player card in the top scoreboard strip.',
      'Tap "End Turn" at the bottom after completing turn actions.'
    ],
    bankerTip: 'The active player card glows with a mint accent ring and pulsing indicator.'
  },
  {
    id: 'app-3',
    stepNumber: 3,
    title: 'Scanning Property Cards',
    subtitle: 'Rent payments, city purchases, and upgrades',
    icon: '🏢',
    description: 'Whenever a player lands on a property space, scan its physical Property QR code.',
    keyActions: [
      'Unowned Property: Shows base price with "Buy Property" and "Auction Property" buttons.',
      'Opponent Property: Auto-calculates rent based on property level and deducts rent from tenant.',
      'Own Property: Awards a FREE +1 Level Upgrade at no extra cost!'
    ],
    bankerTip: 'Self-landing upgrades are completely free and increase future rent multipliers!'
  },
  {
    id: 'app-4',
    stepNumber: 4,
    title: 'Checking Rent Rates (No Pay)',
    subtitle: 'Inspecting property rent & level details safely',
    icon: '🔍',
    description: 'Players can ask the Banker to check current property rent rates at any time without initiating a transaction.',
    keyActions: [
      'Banker scans the physical Property QR code.',
      'The app displays full property specifications, current level, base rent, and tenant rent rate.',
      'Simply tap the close button (✕) in the top-right corner to exit without paying rent or buying!'
    ],
    bankerTip: 'Use rent checking to evaluate trade offers or plan your next board moves!'
  },
  {
    id: 'app-5',
    stepNumber: 5,
    title: 'Running 20s Live Auctions',
    subtitle: 'Handling unowned property bidding & direct sales',
    icon: '🔨',
    description: 'When a player passes on buying a property at base price, tap "Auction Property" to launch a live bidding war.',
    keyActions: [
      '20-Second Countdown: Timer ticks from 20s down to 0s with Web Audio countdown beeps.',
      'Bidding: Tap "+₹100" or "+₹500" under any player\'s name to raise their bid.',
      'Direct Sale Fallback: If timer hits 0s with NO bids, select a buyer from the dropdown, set a price, and click "Sell to Player" (or "Pass Property").'
    ],
    bankerTip: 'Anti-sniping auto-extends the timer by +5 seconds if a bid is placed in the final 3s!'
  },
  {
    id: 'app-6',
    stepNumber: 6,
    title: 'Scanning Action Cards (1–30)',
    subtitle: 'Resolving non-monetary and special event cards',
    icon: '🃏',
    description: 'When a player draws an Action Card, scan its QR code (e.g. CM-ACTION-15) on the app.',
    keyActions: [
      'The app opens the Action Card modal with category badge and balance impact preview.',
      'Targeted Cards: If the card targets another player or property, select the target from the dropdown.',
      'Tap "Proceed / Execute" to apply the effect automatically.'
    ],
    bankerTip: 'Action Cards include movement warps, jail raids, property downgrades, and rent immunity shields!'
  },
  {
    id: 'app-7',
    stepNumber: 7,
    title: 'Banker Tools, Undo & Adjustments',
    subtitle: 'Fixing errors, manual cash edits, and log exports',
    icon: '🛠️',
    description: 'The Banker has full control to reverse mistakes or make manual adjustments.',
    keyActions: [
      'Tap "Undo" in the header to reverse the last transaction.',
      'Tap any event in the Activity Log to inspect full details.',
      'Use Manual Cash Adjustments in settings to credit or debit funds if needed.'
    ],
    bankerTip: 'Export CSV logs at any time to save full match history.'
  }
];

export const ACTION_CARDS_GUIDE: ActionCardRule[] = [
  { id: 'act-1', code: 'CM-ACTION-1', name: 'Tax Refund', category: 'Money', summary: 'Bank Bonus', effect: 'Receive ₹500 from the Bank.' },
  { id: 'act-2', code: 'CM-ACTION-2', name: 'Traffic Fine', category: 'Money', summary: 'City Penalty', effect: 'Pay ₹300 fine to the Bank.' },
  { id: 'act-3', code: 'CM-ACTION-3', name: 'Birthday Bash', category: 'Money', summary: 'Player Gift', effect: 'Collect ₹200 from each player.' },
  { id: 'act-4', code: 'CM-ACTION-4', name: 'Infrastructure Levy', category: 'Property', summary: 'Property Maintenance', effect: 'Pay ₹150 for each property you own.' },
  { id: 'act-5', code: 'CM-ACTION-5', name: 'Speeding Fine', category: 'Jail', summary: 'Police Warrant', effect: 'Go directly to Jail.' },
  { id: 'act-6', code: 'CM-ACTION-6', name: 'Pardon Card', category: 'Jail', summary: 'Bail Waiver', effect: 'Get Out of Jail Free (keep this card).' },
  { id: 'act-7', code: 'CM-ACTION-7', name: 'Free Transit', category: 'Movement', summary: 'Warp Pass', effect: 'Move to any Teleport space for free.' },
  { id: 'act-8', code: 'CM-ACTION-8', name: 'Inheritance Reward', category: 'Money', summary: 'Bank Windfall', effect: 'Receive ₹1,000 from the Bank.' },
  { id: 'act-9', code: 'CM-ACTION-9', name: 'Development Boom', category: 'Property', summary: 'Free City Upgrade', effect: 'Upgrade one of your properties by +1 level for free.' },
  { id: 'act-10', code: 'CM-ACTION-10', name: 'Community Feast', category: 'Money', summary: 'Charity Gift', effect: 'Pay ₹300 to each player.' },
  { id: 'act-11', code: 'CM-ACTION-11', name: 'Stock Market Crash', category: 'Money', summary: 'Financial Loss', effect: 'Pay ₹400 fine to the Bank.' },
  { id: 'act-12', code: 'CM-ACTION-12', name: 'Startup Bonus', category: 'Money', summary: 'Venture Capital', effect: 'Receive ₹750 from the Bank.' },
  { id: 'act-13', code: 'CM-ACTION-13', name: 'Festival Donations', category: 'Money', summary: 'Community Event', effect: 'Pay ₹100 to each other player.' },
  { id: 'act-14', code: 'CM-ACTION-14', name: 'Loan Approved', category: 'Money', summary: 'Bank Loan', effect: 'Receive ₹600 from the Bank, but pay it back next turn.' },
  { id: 'act-15', code: 'CM-ACTION-15', name: 'Dividend Payout', category: 'Money', summary: 'Portfolio Return', effect: 'Receive ₹100 for each property you own.' },
  { id: 'act-16', code: 'CM-ACTION-16', name: 'Renovation Collapse', category: 'Property', summary: 'City Damage', effect: 'Your highest-level property drops by 1 level (ties broken by highest purchase price).' },
  { id: 'act-17', code: 'CM-ACTION-17', name: 'Police Raid', category: 'Jail', summary: 'Target Warrant', effect: 'Send any one other player directly to Jail.' },
  { id: 'act-18', code: 'CM-ACTION-18', name: 'Road Block', category: 'Movement', summary: 'Turn Delay', effect: 'Skip your next turn (forfeit).' },
  { id: 'act-19', code: 'CM-ACTION-19', name: 'Property Swap', category: 'Special', summary: 'Swap Property', effect: 'Swap ownership of one of your properties with any property of another player.' },
  { id: 'act-20', code: 'CM-ACTION-20', name: 'Rent Immunity', category: 'Special', summary: 'Rent Block', effect: 'You pay no rent this turn if you land on an owned property.' },
  { id: 'act-21', code: 'CM-ACTION-21', name: 'Urban Renewal', category: 'Property', summary: 'Target Upgrade', effect: 'Upgrade your lowest-level property by +2 levels for free (ties broken by highest purchase price).' },
  { id: 'act-22', code: 'CM-ACTION-22', name: 'Eminent Domain', category: 'Property', summary: 'Claim Property', effect: 'Select and claim 1 unowned property of your choice for free from the Bank via the interactive selection dropdown.' },
  { id: 'act-23', code: 'CM-ACTION-23', name: 'Property Downgrade', category: 'Property', summary: 'Opponent Damage', effect: 'Target an opponent with 3+ properties (falls back to 2+ or 1+ if 3+ is unavailable) and select their highest-level property to downgrade by 1 level (ties broken by highest purchase price).' },
  { id: 'act-24', code: 'CM-ACTION-24', name: 'Express Highway', category: 'Movement', summary: 'High Rent Warp', effect: 'Move directly to an opponent’s highest-rent property and pay standard rent.' },
  { id: 'act-25', code: 'CM-ACTION-25', name: 'Metro Express', category: 'Movement', summary: 'Start Warp', effect: 'Pass START immediately and collect the ₹2,000 capital bonus.' },
  { id: 'act-26', code: 'CM-ACTION-26', name: 'Reverse Detour', category: 'Movement', summary: 'Position Swap', effect: 'Swap your turn position and active scoreboard card placement with the player directly before you.' },
  { id: 'act-27', code: 'CM-ACTION-27', name: 'Mass Amnesty', category: 'Jail', summary: 'Global Release', effect: 'Release ALL jailed players immediately without paying any bail fee.' },
  { id: 'act-28', code: 'CM-ACTION-28', name: 'Curfew Warrant', category: 'Jail', summary: 'Richest Penalty', effect: 'Send the richest player (highest Net Worth) directly to Jail.' },
  { id: 'act-29', code: 'CM-ACTION-29', name: 'Title Deed Seizure', category: 'Special', summary: 'Seize Property', effect: 'Select and seize 1 Level-1 property from an opponent (dynamically adapts to Level 2+ if no Level-1 properties exist).' },
  { id: 'act-30', code: 'CM-ACTION-30', name: 'Rent Immunity Shield', category: 'Special', summary: 'Extended Shield', effect: 'You are completely immune to paying rent for your next 2 turns.' }
];

export const STRATEGY_TIPS = [
  {
    title: 'Focus on CityMint Sets',
    tip: 'Completing a color group automatically boosts all cities in that set to Level 2 (1.40× rent multiplier) without spending upgrade cash!'
  },
  {
    title: 'Utilize Free Self-Landing Upgrades',
    tip: 'Whenever you land on your own property, you receive a free +1 Level upgrade (up to Level 5 max = 3.50× rent multiplier). Plan token warps to your key hubs!'
  },
  {
    title: 'Use Rent Info Checking Strategically',
    tip: 'Ask the Banker to scan property QR codes anytime to check current rent rates before deciding to buy or trade. The Banker can close the scan view safely!'
  },
  {
    title: 'Win 20s Auctions Efficiently',
    tip: 'If an opponent passes on buying a city at base price, start a 20s auction! You can often acquire key cities below base valuation if other players are low on cash.'
  },
  {
    title: 'Leverage Direct Player Transfers in Debt',
    tip: 'If owing rent to an opponent, transfer properties directly to the creditor player during Debt Settlement to satisfy debt without losing all your cash balance.'
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
