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
    title: 'What is CityMint?',
    category: 'Getting Started',
    summary: 'Introduction to CityMint smart hybrid board game.',
    content: [
      'CityMint is a modern property trading board game combining physical components (board, tokens, dice, cards) with a digital companion app.',
      'One mobile device acts as the CityMint Banker, keeping track of money, ownership, property levels, rent calculations, and game history.',
      'Players do NOT need their own phones or accounts. They scan physical card QRs on the Banker device to perform actions.'
    ]
  },
  {
    id: 'setup',
    title: 'Game Setup',
    category: 'Getting Started',
    summary: 'How to register players and configure starting settings.',
    content: [
      'Choose between 2, 3, or 4 players on the setup screen.',
      'Scan each player\'s physical Card QR or assign a unique identity code (e.g. CM-PLAYER-1).',
      'Choose a display name and select an accent color/token for each player.',
      'Each player starts with a fixed balance of exactly ₹10,000.'
    ]
  },
  {
    id: 'turns',
    title: 'Taking a Turn',
    category: 'Gameplay',
    summary: 'The standard cycle of a player turn.',
    content: [
      'Players roll physical dice and move their tokens on the physical board.',
      'The current player whose turn is shown on the banker screen scans the card or tile they land on.',
      'Alternatively, select the player manually and scan the property card to trigger the landing action.',
      'Once all actions (buying, paying rent, drawing cards) are completed, tap "End Turn" to hand over the phone.'
    ]
  },
  {
    id: 'buying',
    title: 'Buying Properties',
    category: 'Properties',
    summary: 'How to purchase unowned properties on the board.',
    content: [
      'When you land on an unowned property, scan its Property Card QR on the Banker device.',
      'The screen will display the property\'s name, group, and purchase price.',
      'If you have sufficient balance, tap "Buy Property" to pay the Bank.',
      'Ownership will be assigned, and the purchase transaction will be logged.'
    ]
  },
  {
    id: 'rent',
    title: 'Rent & Dynamic Levels',
    category: 'Properties',
    summary: 'Rent calculations and level multipliers (Level 1-5).',
    content: [
      'When a player lands on an owned property, they must pay rent to the owner.',
      'Rent is calculated dynamically: Rent = Base Rent × Level Multiplier.',
      'Every time a player lands on an owned property, its rent level increases by +1 (up to Level 5).',
      'Rent multipliers are: L1 = 1.00×, L2 = 1.40×, L3 = 1.80×, L4 = 2.50×, L5 = 3.50×.'
    ]
  },
  {
    id: 'groups',
    title: 'Property Groups & Completion',
    category: 'Properties',
    summary: 'Group completion checks and level-up bonuses.',
    content: [
      'The 22 board properties are divided into 8 colored groups (2 or 3 properties per group).',
      'When the final unowned property in a group is purchased, the Group Completion Bonus triggers.',
      'All properties in that group instantly gain +1 level (capped at Level 5).',
      'Properties do NOT need to be owned by the same player to trigger this bonus.',
      'The completion bonus triggers only once per group per game.'
    ]
  },
  {
    id: 'jail',
    title: 'Jail System & Rent Rule',
    category: 'Special Spaces',
    summary: 'Entering jail, escaping, and jail rent restrictions.',
    content: [
      'A player can enter Jail by landing on the "Go To Jail" board space or via an Action Card.',
      'While in Jail, the player CANNOT collect rent on any of their owned properties.',
      'Normal rent collection resumes immediately when the owner is released from Jail.',
      'To get released, pay ₹500 on your turn or use a "Get Out of Jail Free" Action Card.'
    ]
  },
  {
    id: 'teleport',
    title: 'Teleportation Spaces',
    category: 'Special Spaces',
    summary: 'Costs and rules for moving between Teleport spaces.',
    content: [
      'There are exactly 4 Teleport spaces on the board.',
      'Landing on or scanning a Teleport space prompts the player to pay a fixed ₹500 teleportation fee.',
      'If the fee is paid, the player selects any destination space on the board and moves their physical token there.',
      'If cash is below ₹500, teleportation is blocked.'
    ]
  },
  {
    id: 'start',
    title: 'Start space',
    category: 'Special Spaces',
    summary: 'Passing start and collecting rewards.',
    content: [
      'Passing or landing on the START space awards a player a fixed ₹2,000 reward from the Bank.',
      'Scan the START QR or trigger the action manually on the player asset screen to credit the balance.'
    ]
  },
  {
    id: 'debt',
    title: 'Debt Settlement & Sales',
    category: 'Bankruptcy',
    summary: 'Liquidating properties to cover shortfalls.',
    content: [
      'If a rent payment, tax, or penalty is greater than your cash balance, the game enters Debt Settlement mode.',
      'The app displays the shortfall and lists eligible properties owned by the debtor.',
      'Players can sell owned properties to the Bank for half of their total calculated value.',
      'Once enough properties are sold to cover the debt, the payment is resolved automatically.'
    ]
  },
  {
    id: 'bankruptcy',
    title: 'Declaring Bankruptcy',
    category: 'Bankruptcy',
    summary: 'Eliminating a player or ending the game.',
    content: [
      'If a player cannot satisfy their debt even after selling all properties, they declare Bankruptcy.',
      'The banker is prompted with two choices:',
      '1. Remove Player & Continue: The bankrupt player is eliminated, their properties return to unowned L1, and survivors continue.',
      '2. End Game & Calculate Winner: Immediately end the game. Rankings are calculated based on Net Worth.'
    ]
  },
  {
    id: 'winning',
    title: 'Winning & Valuation',
    category: 'Winning',
    summary: 'How Net Worth is calculated and champion declaration.',
    content: [
      'When the game is ended, the player with the highest Net Worth is declared the CityMint Champion.',
      'Net Worth Formula: Net Worth = Cash + Eligible Property Value.',
      'Property Value = Purchase Price + (Level - 1) * (Base Rent * 5). Upgrading properties increases your net worth!',
      'The Winner Screen displays final statistics including game duration, total rent paid, and rankings.'
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
