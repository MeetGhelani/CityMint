export interface Player {
  id: string;
  playerCode: string; // QR code identifier: e.g. CM-PLAYER-7K4M92
  name: string;
  color: string;
  balance: number;
  status: 'ACTIVE' | 'IN_JAIL' | 'BANKRUPT' | 'ELIMINATED';
  jailTurns: number;
}

export interface Property {
  id: string;
  cityName: string;
  groupId: string;
  purchasePrice: number;
  baseRent: number;
  level: number; // 1 to 5
  ownerId: string | null; // Null if unowned
}

export interface GameTransaction {
  id: string;
  turnNumber: number;
  type: 
    | 'PURCHASE' 
    | 'RENT' 
    | 'START' 
    | 'TELEPORT' 
    | 'JAIL_ENTER' 
    | 'JAIL_RELEASE' 
    | 'ACTION_CARD' 
    | 'MANUAL_CORRECTION' 
    | 'SALE' 
    | 'DEBT_PAYMENT' 
    | 'BANKRUPTCY';
  sourcePlayerId?: string;
  targetPlayerId?: string;
  amount: number;
  propertyId?: string;
  description: string;
  createdAt: string;
}

export interface GameState {
  id: string; // CM-XXXXXX
  status: 'SETUP' | 'ACTIVE' | 'BANKRUPTCY_REVIEW' | 'ENDED';
  currentPlayerId: string | null;
  turnNumber: number;
  players: Player[];
  properties: Property[];
  transactions: GameTransaction[];
  undoStack: string[]; // Serialized state snapshots for full transactional rollbacks
  completedGroups: string[]; // Group IDs that have already triggered completion bonus
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  activeDebt?: {
    debtorId: string;
    creditorId: string | 'BANK'; // 'BANK' or another player ID
    amountDue: number;
    shortfall: number;
  };
}

// Initial Property Config Dataset (22 Properties, 8 groups)
export const INITIAL_PROPERTIES: Omit<Property, 'level' | 'ownerId'>[] = [
  // Group 1: Brown (2)
  { id: 'kochi', cityName: 'Kochi', groupId: 'brown', purchasePrice: 600, baseRent: 30 },
  { id: 'goa', cityName: 'Goa', groupId: 'brown', purchasePrice: 800, baseRent: 40 },
  
  // Group 2: Light Blue (3)
  { id: 'patna', cityName: 'Patna', groupId: 'lightblue', purchasePrice: 1000, baseRent: 60 },
  { id: 'indore', cityName: 'Indore', groupId: 'lightblue', purchasePrice: 1200, baseRent: 80 },
  { id: 'jaipur', cityName: 'Jaipur', groupId: 'lightblue', purchasePrice: 1400, baseRent: 100 },
  
  // Group 3: Pink (3)
  { id: 'lucknow', cityName: 'Lucknow', groupId: 'pink', purchasePrice: 1600, baseRent: 120 },
  { id: 'chandigarh', cityName: 'Chandigarh', groupId: 'pink', purchasePrice: 1800, baseRent: 140 },
  { id: 'surat', cityName: 'Surat', groupId: 'pink', purchasePrice: 2000, baseRent: 160 },
  
  // Group 4: Orange (3)
  { id: 'ahmedabad', cityName: 'Ahmedabad', groupId: 'orange', purchasePrice: 2200, baseRent: 180 },
  { id: 'pune', cityName: 'Pune', groupId: 'orange', purchasePrice: 2400, baseRent: 200 },
  { id: 'hyderabad', cityName: 'Hyderabad', groupId: 'orange', purchasePrice: 2600, baseRent: 220 },
  
  // Group 5: Red (3)
  { id: 'nagpur', cityName: 'Nagpur', groupId: 'red', purchasePrice: 2800, baseRent: 240 },
  { id: 'vizag', cityName: 'Visakhapatnam', groupId: 'red', purchasePrice: 3000, baseRent: 260 },
  { id: 'bhubaneswar', cityName: 'Bhubaneswar', groupId: 'red', purchasePrice: 3200, baseRent: 280 },
  
  // Group 6: Yellow (3)
  { id: 'chennai', cityName: 'Chennai', groupId: 'yellow', purchasePrice: 3500, baseRent: 300 },
  { id: 'kolkata', cityName: 'Kolkata', groupId: 'yellow', purchasePrice: 3800, baseRent: 320 },
  { id: 'bengaluru', cityName: 'Bengaluru', groupId: 'yellow', purchasePrice: 4000, baseRent: 350 },
  
  // Group 7: Green (3)
  { id: 'mumbai', cityName: 'Mumbai', groupId: 'green', purchasePrice: 4500, baseRent: 400 },
  { id: 'delhi', cityName: 'Delhi', groupId: 'green', purchasePrice: 5000, baseRent: 450 },
  { id: 'gurugram', cityName: 'Gurugram', groupId: 'green', purchasePrice: 5500, baseRent: 500 },
  
  // Group 8: Blue (2)
  { id: 'noida', cityName: 'Noida', groupId: 'blue', purchasePrice: 6500, baseRent: 600 },
  { id: 'citymint', cityName: 'CityMint', groupId: 'blue', purchasePrice: 8000, baseRent: 800 },
];

export const PROPERTY_GROUPS: Record<string, { name: string; color: string; gradientFrom: string; gradientTo: string; count: number }> = {
  brown:     { name: 'Coastal Gateway',   color: '#A0522D', gradientFrom: '#5C280C', gradientTo: '#281005', count: 2 },
  lightblue: { name: 'Historic Heartland', color: '#38BDF8', gradientFrom: '#0284C7', gradientTo: '#083344', count: 3 },
  pink:      { name: 'Industrial Hubs',    color: '#F43F5E', gradientFrom: '#BE123C', gradientTo: '#4C0519', count: 3 },
  orange:    { name: 'Tech Corridors',     color: '#FF6600', gradientFrom: '#D94600', gradientTo: '#571A00', count: 3 },
  red:       { name: 'Smart Cities',       color: '#EF4444', gradientFrom: '#B91C1C', gradientTo: '#450A0A', count: 3 },
  yellow:    { name: 'Metropolises',       color: '#EAB308', gradientFrom: '#CA8A04', gradientTo: '#422006', count: 3 },
  green:     { name: 'Financial Capital',  color: '#10B981', gradientFrom: '#047857', gradientTo: '#022C22', count: 3 },
  blue:      { name: 'Elite Zone',         color: '#3B82F6', gradientFrom: '#1D4ED8', gradientTo: '#0F172A', count: 2 },
};

// Rent Multipliers
export const RENT_MULTIPLIERS = {
  1: 1.00,
  2: 1.40,
  3: 1.80,
  4: 2.50,
  5: 3.50,
};

// Action Card Definitions
export interface ActionCard {
  id: string;
  name: string;
  category: 'Money' | 'Property' | 'Movement' | 'Jail' | 'Special';
  description: string;
  effect: (gameState: GameState, playerId: string) => void;
}

export const ACTION_CARDS: Omit<ActionCard, 'effect'>[] = [
  // ── Money ──
  { id: 'act-1',  name: 'Tax Refund',         category: 'Money',    description: 'Receive ₹500 from the Bank.' },
  { id: 'act-2',  name: 'Traffic Fine',         category: 'Money',    description: 'Pay ₹300 fine to the Bank.' },
  { id: 'act-3',  name: 'Birthday Bash',        category: 'Money',    description: 'Collect ₹200 from each player.' },
  { id: 'act-8',  name: 'Inheritance Reward',   category: 'Money',    description: 'Receive ₹1,000 from the Bank.' },
  { id: 'act-10', name: 'Community Feast',      category: 'Money',    description: 'Pay ₹300 to each player.' },
  { id: 'act-11', name: 'Stock Market Crash',   category: 'Money',    description: 'Pay ₹400 fine to the Bank.' },
  { id: 'act-12', name: 'Startup Bonus',        category: 'Money',    description: 'Receive ₹750 from the Bank.' },
  { id: 'act-13', name: 'Festival Donations',   category: 'Money',    description: 'Pay ₹100 to each other player.' },
  { id: 'act-14', name: 'Loan Approved',        category: 'Money',    description: 'Receive ₹600 from the Bank, but pay it back next turn (₹600 auto-deducted at turn end).' },
  { id: 'act-15', name: 'Dividend Payout',      category: 'Money',    description: 'Receive ₹100 for each property you own.' },
  // ── Property ──
  { id: 'act-4',  name: 'Infrastructure Levy',  category: 'Property', description: 'Pay ₹150 for each property you own.' },
  { id: 'act-9',  name: 'Development Boom',     category: 'Property', description: 'Upgrade one of your properties by +1 level for free.' },
  { id: 'act-16', name: 'Renovation Collapse',  category: 'Property', description: 'Your highest-level property drops by 1 level.' },
  // ── Jail ──
  { id: 'act-5',  name: 'Speeding Fine',        category: 'Jail',     description: 'Go directly to Jail.' },
  { id: 'act-6',  name: 'Pardon Card',          category: 'Jail',     description: 'Get Out of Jail Free (keep this card).' },
  { id: 'act-17', name: 'Police Raid',          category: 'Jail',     description: 'Send any one other player directly to Jail.' },
  // ── Movement ──
  { id: 'act-7',  name: 'Free Transit',         category: 'Movement', description: 'Move to any Teleport space for free.' },
  { id: 'act-18', name: 'Road Block',           category: 'Movement', description: 'Skip your next turn (forfeit).' },
  // ── Special ──
  { id: 'act-19', name: 'Property Swap',        category: 'Special',  description: 'Swap ownership of one of your properties with any property of another player.' },
  { id: 'act-20', name: 'Rent Immunity',        category: 'Special',  description: 'You pay no rent this turn if you land on an owned property.' },
];

// Helper to push history snapshot to Undo stack
function pushUndoSnapshot(state: GameState): string[] {
  // Strip out undoStack from snapshot to save space and prevent recursive logs
  const { undoStack, ...snapshot } = state;
  const serialized = JSON.stringify(snapshot);
  return [...state.undoStack, serialized];
}

// Generate Game ID
export function generateGameId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars O, I, 1, 0
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CM-${id}`;
}

// Create Game Engine Initial State
export function createGame(
  playersData: { name: string; color: string; playerCode: string }[],
  startingBalance: number = 10000
): GameState {
  const id = generateGameId();
  const players: Player[] = playersData.map((p, idx) => ({
    id: `player-${idx + 1}`,
    playerCode: p.playerCode,
    name: p.name,
    color: p.color,
    balance: startingBalance, // starting cash
    status: 'ACTIVE',
    jailTurns: 0,
  }));

  const properties: Property[] = INITIAL_PROPERTIES.map((prop) => ({
    ...prop,
    level: 1,
    ownerId: null,
  }));

  return {
    id,
    status: 'ACTIVE',
    currentPlayerId: players[0]?.id || null,
    turnNumber: 1,
    players,
    properties,
    transactions: [],
    undoStack: [],
    completedGroups: [],
    winnerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    endedAt: null,
  };
}

// Calculate Current Rent
export function getRentAmount(property: Property, owner: Player | undefined): number {
  if (!owner || owner.status === 'IN_JAIL') {
    return 0; // Jailed owners cannot collect rent
  }
  const mult = RENT_MULTIPLIERS[property.level as keyof typeof RENT_MULTIPLIERS] || 1.0;
  return Math.round(property.baseRent * mult);
}

// Calculate Player Property Asset Valuations
export function getPropertyValue(property: Property): number {
  // Valuation includes starting value + incremental upgrades value
  return property.purchasePrice + (property.level - 1) * (property.baseRent * 5);
}

// Calculate Net Worth
export function calculateNetWorth(player: Player, properties: Property[]): number {
  if (player.status === 'ELIMINATED' || player.status === 'BANKRUPT') {
    return 0;
  }
  const ownedProps = properties.filter((p) => p.ownerId === player.id);
  const propsValue = ownedProps.reduce((sum, p) => sum + getPropertyValue(p), 0);
  return player.balance + propsValue;
}

// Turn Switcher
export function endTurn(state: GameState): GameState {
  if (state.status !== 'ACTIVE') return state;

  const activePlayers = state.players.filter((p) => p.status === 'ACTIVE' || p.status === 'IN_JAIL');
  if (activePlayers.length <= 1) {
    return endGame(state);
  }

  const currentIndex = activePlayers.findIndex((p) => p.id === state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  const nextPlayer = activePlayers[nextIndex];

  // ── Jail Turn Counter & Auto-Release Logic ──
  // When switching TO a jailed player, increment their jail counter.
  // If they have already waited 3 full turns, auto-debit ₹500 and release them.
  let updatedPlayers = state.players.map((p) => {
    if (p.id === nextPlayer.id && p.status === 'IN_JAIL') {
      return { ...p, jailTurns: p.jailTurns + 1 };
    }
    return p;
  });

  let extraTransactions: GameTransaction[] = [];

  const updatedNextPlayer = updatedPlayers.find((p) => p.id === nextPlayer.id);
  if (updatedNextPlayer && updatedNextPlayer.status === 'IN_JAIL' && updatedNextPlayer.jailTurns >= 3) {
    // Auto-force release: debit ₹500 (or whatever they have if broke)
    const bailFee = Math.min(500, updatedNextPlayer.balance);
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.id === nextPlayer.id) {
        return {
          ...p,
          status: 'ACTIVE' as const,
          balance: p.balance - bailFee,
          jailTurns: 0,
        };
      }
      return p;
    });

    extraTransactions = [{
      id: crypto.randomUUID(),
      turnNumber: state.turnNumber,
      type: 'JAIL_RELEASE',
      sourcePlayerId: nextPlayer.id,
      amount: bailFee,
      description: `${nextPlayer.name} served 3 jail turns and was auto-released. ₹${bailFee} bail fee deducted.`,
      createdAt: new Date().toISOString(),
    }];
  }

  return {
    ...state,
    currentPlayerId: nextPlayer.id,
    turnNumber: state.currentPlayerId === activePlayers[activePlayers.length - 1].id ? state.turnNumber + 1 : state.turnNumber,
    players: updatedPlayers,
    transactions: extraTransactions.length > 0 ? [...extraTransactions, ...state.transactions] : state.transactions,
    updatedAt: new Date().toISOString(),
  };
}

// Purchase Property
export function purchaseProperty(state: GameState, playerId: string, propertyId: string): GameState {
  if (state.status !== 'ACTIVE') return state;
  
  const player = state.players.find((p) => p.id === playerId);
  const property = state.properties.find((p) => p.id === propertyId);

  if (!player || !property || property.ownerId !== null || player.status !== 'ACTIVE') {
    return state;
  }

  if (player.balance < property.purchasePrice) {
    return state; // Block purchase (UI handles showing warnings)
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance - property.purchasePrice };
    }
    return p;
  });

  let updatedProperties = state.properties.map((p) => {
    if (p.id === propertyId) {
      return { ...p, ownerId: playerId };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'PURCHASE',
    sourcePlayerId: playerId,
    amount: property.purchasePrice,
    propertyId: propertyId,
    description: `${player.name} purchased ${property.cityName} for ₹${property.purchasePrice}`,
    createdAt: new Date().toISOString(),
  };

  // Perform Group Bonus Check: All properties in group owned by SAME player
  let updatedCompletedGroups = [...state.completedGroups];
  const group = PROPERTY_GROUPS[property.groupId];
  if (group) {
    const groupProperties = updatedProperties.filter((p) => p.groupId === property.groupId);
    const allOwnedBySamePlayer = groupProperties.every((p) => p.ownerId === playerId);
    const alreadyCompleted = state.completedGroups.includes(property.groupId);

    if (allOwnedBySamePlayer && !alreadyCompleted) {
      updatedCompletedGroups.push(property.groupId);
      // Automatically upgrade all properties in group from Level 1 to Level 2
      updatedProperties = updatedProperties.map((p) => {
        if (p.groupId === property.groupId) {
          return { ...p, level: Math.min(p.level + 1, 5) };
        }
        return p;
      });
    }
  }

  return {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    completedGroups: updatedCompletedGroups,
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// Pay Rent
export function payRent(state: GameState, payerId: string, propertyId: string): GameState {
  if (state.status !== 'ACTIVE') return state;

  const payer = state.players.find((p) => p.id === payerId);
  const property = state.properties.find((p) => p.id === propertyId);

  if (!payer || !property || property.ownerId === null || property.ownerId === payerId || payer.status !== 'ACTIVE') {
    return state;
  }

  const owner = state.players.find((p) => p.id === property.ownerId);
  const rentAmount = getRentAmount(property, owner);

  const updatedUndoStack = pushUndoSnapshot(state);

  // Property level increases by +1 on every landing, capped at 5
  const updatedProperties = state.properties.map((p) => {
    if (p.id === propertyId) {
      return { ...p, level: Math.min(p.level + 1, 5) };
    }
    return p;
  });

  if (rentAmount === 0) {
    // No rent collected (e.g. Owner is in jail)
    const transaction: GameTransaction = {
      id: crypto.randomUUID(),
      turnNumber: state.turnNumber,
      type: 'RENT',
      sourcePlayerId: payerId,
      targetPlayerId: property.ownerId,
      amount: 0,
      propertyId,
      description: `${payer.name} visited ${property.cityName} but paid no rent (Owner ${owner?.name || ''} in Jail)`,
      createdAt: new Date().toISOString(),
    };

    return {
      ...state,
      properties: updatedProperties,
      transactions: [transaction, ...state.transactions],
      undoStack: updatedUndoStack,
      updatedAt: new Date().toISOString(),
    };
  }

  if (payer.balance >= rentAmount) {
    // Normal Rent Payment
    const updatedPlayers = state.players.map((p) => {
      if (p.id === payerId) {
        return { ...p, balance: p.balance - rentAmount };
      }
      if (p.id === property.ownerId) {
        return { ...p, balance: p.balance + rentAmount };
      }
      return p;
    });

    const transaction: GameTransaction = {
      id: crypto.randomUUID(),
      turnNumber: state.turnNumber,
      type: 'RENT',
      sourcePlayerId: payerId,
      targetPlayerId: property.ownerId,
      amount: rentAmount,
      propertyId,
      description: `${payer.name} paid ₹${rentAmount} rent to ${owner?.name} at ${property.cityName}`,
      createdAt: new Date().toISOString(),
    };

    return {
      ...state,
      players: updatedPlayers,
      properties: updatedProperties,
      transactions: [transaction, ...state.transactions],
      undoStack: updatedUndoStack,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Insufficient Balance -> Trigger Debt Settlement Review Mode
    const shortfall = rentAmount - payer.balance;
    return {
      ...state,
      status: 'BANKRUPTCY_REVIEW',
      activeDebt: {
        debtorId: payerId,
        creditorId: property.ownerId,
        amountDue: rentAmount,
        shortfall,
      },
      properties: updatedProperties,
      undoStack: updatedUndoStack,
      updatedAt: new Date().toISOString(),
    };
  }
}

// Pass Start Reward
export function passStart(state: GameState, playerId: string): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== 'ACTIVE') return state;

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance + 2000 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'START',
    sourcePlayerId: playerId,
    amount: 2000,
    description: `${player.name} passed START and received ₹2,000`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: updatedPlayers,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// Teleport Spaces Action
export function activateTeleport(state: GameState, playerId: string): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== 'ACTIVE') return state;

  if (player.balance < 500) {
    return state; // Insufficient cash (UI block)
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance - 500 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'TELEPORT',
    sourcePlayerId: playerId,
    amount: 500,
    description: `${player.name} paid ₹500 for Teleportation`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: updatedPlayers,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// Send Player to Jail
export function sendToJail(state: GameState, playerId: string): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== 'ACTIVE') return state;

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, status: 'IN_JAIL' as const, jailTurns: 0 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'JAIL_ENTER',
    sourcePlayerId: playerId,
    amount: 0,
    description: `${player.name} went directly to Jail`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: updatedPlayers,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// Release Player from Jail
export function releaseFromJail(state: GameState, playerId: string, method: 'PAY' | 'CARD'): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== 'IN_JAIL') return state;

  if (method === 'PAY' && player.balance < 500) {
    return state; // UI checks this
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      const deduction = method === 'PAY' ? 500 : 0;
      return { ...p, status: 'ACTIVE' as const, balance: p.balance - deduction, jailTurns: 0 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'JAIL_RELEASE',
    sourcePlayerId: playerId,
    amount: method === 'PAY' ? 500 : 0,
    description: `${player.name} got released from Jail via ${method === 'PAY' ? '₹500 payment' : 'Pardon Card'}`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: updatedPlayers,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// Sell Property to satisfy debt
export function sellProperty(state: GameState, playerId: string, propertyId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  const property = state.properties.find((p) => p.id === propertyId);

  if (!player || !property || property.ownerId !== playerId) {
    return state;
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const refund = property.purchasePrice; // Full purchase price refund when selling

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance + refund };
    }
    return p;
  });

  const updatedProperties = state.properties.map((p) => {
    if (p.id === propertyId) {
      return { ...p, ownerId: null, level: 1 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'SALE',
    sourcePlayerId: playerId,
    amount: refund,
    propertyId,
    description: `${player.name} sold ${property.cityName} back to the Bank for ₹${refund}`,
    createdAt: new Date().toISOString(),
  };

  let nextState: GameState = {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate debt shortfall if currently in debt settlement review
  if (nextState.status === 'BANKRUPTCY_REVIEW' && nextState.activeDebt && nextState.activeDebt.debtorId === playerId) {
    const updatedDebtor = nextState.players.find((p) => p.id === playerId)!;
    const newShortfall = nextState.activeDebt.amountDue - updatedDebtor.balance;

    nextState.activeDebt = {
      ...nextState.activeDebt,
      shortfall: Math.max(0, newShortfall),
    };

    // If debtor balance is now enough to pay the debt, we can resolve it!
    if (newShortfall <= 0) {
      nextState = resolveDebt(nextState);
    }
  }

  return nextState;
}

/**
 * Transfers a property directly from a debtor to a PLAYER creditor as debt payment.
 * Used exclusively during BANKRUPTCY_REVIEW when the creditor is another player (not BANK).
 *
 * - Property ownership moves to the creditor (not unowned).
 * - Property's purchasePrice is applied against the amountDue — no cash changes hands.
 * - If purchasePrice >= remaining amountDue → debt fully cleared, game resumes ACTIVE.
 * - If purchasePrice < remaining amountDue → shortfall reduced, debtor can pay rest with cash or more properties.
 */
export function transferPropertyAsDebtPayment(
  state: GameState,
  debtorId: string,
  propertyId: string
): GameState {
  if (state.status !== 'BANKRUPTCY_REVIEW' || !state.activeDebt) return state;

  const { creditorId, amountDue } = state.activeDebt;

  // Only applies for player-to-player debt (not bank)
  if (creditorId === 'BANK') return state;

  const debtor = state.players.find((p) => p.id === debtorId);
  const creditor = state.players.find((p) => p.id === creditorId);
  const property = state.properties.find((p) => p.id === propertyId);

  if (!debtor || !creditor || !property || property.ownerId !== debtorId) return state;

  const updatedUndoStack = pushUndoSnapshot(state);
  const propValue = property.purchasePrice;
  const newAmountDue = Math.max(0, amountDue - propValue);
  const newShortfall = Math.max(0, newAmountDue - debtor.balance);

  // Transfer property to creditor, reset level to 1 (distressed sale)
  const updatedProperties = state.properties.map((p) =>
    p.id === propertyId ? { ...p, ownerId: creditorId, level: 1 } : p
  );

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'DEBT_PAYMENT',
    sourcePlayerId: debtorId,
    targetPlayerId: creditorId,
    amount: propValue,
    propertyId,
    description: `${debtor.name} transferred ${property.cityName} to ${creditor.name} as debt payment (₹${propValue} credited toward ₹${amountDue} debt)`,
    createdAt: new Date().toISOString(),
  };

  let nextState: GameState = {
    ...state,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    activeDebt: {
      ...state.activeDebt,
      amountDue: newAmountDue,
      shortfall: newShortfall,
    },
    updatedAt: new Date().toISOString(),
  };

  // If property value covered the full remaining debt → resolve immediately (no cash deducted)
  if (newAmountDue === 0) {
    nextState = {
      ...nextState,
      status: 'ACTIVE',
      activeDebt: undefined,
    };
  }

  return nextState;
}

// Complete debt payment once player liquidates enough assets
export function resolveDebt(state: GameState): GameState {
  if (state.status !== 'BANKRUPTCY_REVIEW' || !state.activeDebt) return state;

  const { debtorId, creditorId, amountDue } = state.activeDebt;
  const debtor = state.players.find((p) => p.id === debtorId);

  if (!debtor || debtor.balance < amountDue) return state;

  const updatedPlayers = state.players.map((p) => {
    if (p.id === debtorId) {
      return { ...p, balance: p.balance - amountDue };
    }
    if (creditorId !== 'BANK' && p.id === creditorId) {
      return { ...p, balance: p.balance + amountDue };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'DEBT_PAYMENT',
    sourcePlayerId: debtorId,
    targetPlayerId: creditorId === 'BANK' ? undefined : creditorId,
    amount: amountDue,
    description: `${debtor.name} satisfied outstanding debt of ₹${amountDue} to ${creditorId === 'BANK' ? 'Bank' : state.players.find((p) => p.id === creditorId)?.name}`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    status: 'ACTIVE',
    activeDebt: undefined,
    players: updatedPlayers,
    transactions: [transaction, ...state.transactions],
    updatedAt: new Date().toISOString(),
  };
}

// Handle Bankrupt Declarations
export function declareBankruptcy(state: GameState, choice: 'ELIMINATE' | 'END_GAME'): GameState {
  if (state.status !== 'BANKRUPTCY_REVIEW' || !state.activeDebt) return state;

  const { debtorId, creditorId, amountDue } = state.activeDebt;
  const debtor = state.players.find((p) => p.id === debtorId)!;

  const updatedUndoStack = pushUndoSnapshot(state);

  if (choice === 'END_GAME') {
    // Immediately end the game and run net worth calculations
    return endGame({
      ...state,
      undoStack: updatedUndoStack,
    });
  }

  // Option: ELIMINATE player
  // Transfer remaining cash to creditor
  const remainingCash = Math.max(0, debtor.balance);
  let updatedPlayers = state.players.map((p) => {
    if (p.id === debtorId) {
      return { ...p, status: 'ELIMINATED' as const, balance: 0 };
    }
    if (creditorId !== 'BANK' && p.id === creditorId) {
      return { ...p, balance: p.balance + remainingCash };
    }
    return p;
  });

  // Revert all properties owned by bankrupt player back to UNOWNED / Level 1
  const updatedProperties = state.properties.map((p) => {
    if (p.ownerId === debtorId) {
      return { ...p, ownerId: null, level: 1 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'BANKRUPTCY',
    sourcePlayerId: debtorId,
    amount: remainingCash,
    description: `${debtor.name} declared Bankruptcy and was eliminated from the game. Assets liquidated.`,
    createdAt: new Date().toISOString(),
  };

  let nextState: GameState = {
    ...state,
    status: 'ACTIVE',
    activeDebt: undefined,
    players: updatedPlayers,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };

  // Check if game is over (only 1 player remaining active)
  const survivors = nextState.players.filter((p) => p.status === 'ACTIVE' || p.status === 'IN_JAIL');
  if (survivors.length <= 1) {
    nextState = endGame(nextState);
  } else if (nextState.currentPlayerId === debtorId) {
    // If the eliminated player was taking their turn, advance to next player
    nextState = endTurn(nextState);
  }

  return nextState;
}

// End Game & Determine Winner
export function endGame(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => p.status !== 'ELIMINATED' && p.status !== 'BANKRUPT');
  
  let winnerId: string | null = null;
  let maxWorth = -1;

  state.players.forEach((p) => {
    const worth = calculateNetWorth(p, state.properties);
    if (worth > maxWorth) {
      maxWorth = worth;
      winnerId = p.id;
    }
  });

  return {
    ...state,
    status: 'ENDED',
    winnerId,
    endedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Execute Action Card Trigger
export function executeActionCard(state: GameState, playerId: string, cardId: string): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === playerId);
  const card = ACTION_CARDS.find((c) => c.id === cardId);

  if (!player || !card || player.status !== 'ACTIVE') return state;

  const updatedUndoStack = pushUndoSnapshot(state);

  let updatedPlayers = [...state.players];
  let updatedProperties = [...state.properties];
  let nextStatus: GameState['status'] = state.status;
  let activeDebt = state.activeDebt;

  let amount = 0;
  let description = `${player.name} drew Action Card: "${card.name}"`;

  switch (cardId) {
    case 'act-1': // Tax Refund: +500
      amount = 500;
      updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance + 500 } : p));
      break;

    case 'act-2': // Traffic Fine: -300
      amount = 300;
      if (player.balance >= 300) {
        updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance - 300 } : p));
      } else {
        nextStatus = 'BANKRUPTCY_REVIEW';
        activeDebt = { debtorId: playerId, creditorId: 'BANK', amountDue: 300, shortfall: 300 - player.balance };
      }
      break;

    case 'act-3': // Birthday: +200 from each player
      amount = 200;
      const otherActive = state.players.filter((p) => p.id !== playerId && (p.status === 'ACTIVE' || p.status === 'IN_JAIL'));
      let totalCollected = 0;

      updatedPlayers = state.players.map((p) => {
        if (p.id === playerId) return p;
        if (p.status === 'ACTIVE' || p.status === 'IN_JAIL') {
          const paid = Math.min(p.balance, 200); // collect what they have
          totalCollected += paid;
          return { ...p, balance: p.balance - paid };
        }
        return p;
      });

      updatedPlayers = updatedPlayers.map((p) => (p.id === playerId ? { ...p, balance: p.balance + totalCollected } : p));
      description += ` and collected a total of ₹${totalCollected} from other players.`;
      break;

    case 'act-4': // Renovations: -150 per property owned
      const ownedCount = state.properties.filter((p) => p.ownerId === playerId).length;
      const totalCost = ownedCount * 150;
      amount = totalCost;

      if (player.balance >= totalCost) {
        updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance - totalCost } : p));
      } else {
        nextStatus = 'BANKRUPTCY_REVIEW';
        activeDebt = { debtorId: playerId, creditorId: 'BANK', amountDue: totalCost, shortfall: totalCost - player.balance };
      }
      description += `, paying ₹${totalCost} for ${ownedCount} owned properties.`;
      break;

    case 'act-5': // Speeding Fine -> Jail
      return sendToJail(state, playerId);

    case 'act-6': // Pardon Card -> Keep card (we will log it, or simply give player ₹500 value)
      amount = 0;
      description += '. Handed Get Out of Jail Free Pardon Card.';
      break;

    case 'act-7': // Free Transit -> No money effect, free teleport
      amount = 0;
      description += '. Can now move to any Teleport space for free.';
      break;

    case 'act-8': // Inheritance: +1000
      amount = 1000;
      updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance + 1000 } : p));
      break;

    case 'act-9': // Development Upgrade -> Free upgrade of player's lowest property
      const owned = state.properties.filter((p) => p.ownerId === playerId && p.level < 5);
      if (owned.length > 0) {
        // Sort lowest level first
        owned.sort((a, b) => a.level - b.level);
        const targetProp = owned[0];
        updatedProperties = state.properties.map((p) => (p.id === targetProp.id ? { ...p, level: p.level + 1 } : p));
        description += `, upgrading ${targetProp.cityName} to Level ${targetProp.level + 1} for free.`;
      } else {
        description += ', but owns no upgradable properties.';
      }
      break;

    case 'act-10': // Community Feast: pay 300 to each other player
      const otherActiveFeest = state.players.filter((p) => p.id !== playerId && (p.status === 'ACTIVE' || p.status === 'IN_JAIL'));
      const feastCost = otherActiveFeest.length * 300;
      amount = feastCost;

      if (player.balance >= feastCost) {
        updatedPlayers = state.players.map((p) => {
          if (p.id === playerId) {
            return { ...p, balance: p.balance - feastCost };
          }
          if (p.status === 'ACTIVE' || p.status === 'IN_JAIL') {
            return { ...p, balance: p.balance + 300 };
          }
          return p;
        });
      } else {
        nextStatus = 'BANKRUPTCY_REVIEW';
        activeDebt = { debtorId: playerId, creditorId: 'BANK', amountDue: feastCost, shortfall: feastCost - player.balance };
      }
      break;

    case 'act-11': // Stock Market Crash: -400
      amount = 400;
      if (player.balance >= 400) {
        updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance - 400 } : p));
      } else {
        nextStatus = 'BANKRUPTCY_REVIEW';
        activeDebt = { debtorId: playerId, creditorId: 'BANK', amountDue: 400, shortfall: 400 - player.balance };
      }
      break;

    case 'act-12': // Startup Bonus: +750
      amount = 750;
      updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance + 750 } : p));
      break;

    case 'act-13': // Festival Donations: pay ₹100 to each other player
      {
        const festivalCost = state.players.filter((p) => p.id !== playerId && (p.status === 'ACTIVE' || p.status === 'IN_JAIL')).length * 100;
        amount = festivalCost;
        if (player.balance >= festivalCost) {
          updatedPlayers = state.players.map((p) => {
            if (p.id === playerId) return { ...p, balance: p.balance - festivalCost };
            if (p.status === 'ACTIVE' || p.status === 'IN_JAIL') return { ...p, balance: p.balance + 100 };
            return p;
          });
        } else {
          nextStatus = 'BANKRUPTCY_REVIEW';
          activeDebt = { debtorId: playerId, creditorId: 'BANK', amountDue: festivalCost, shortfall: festivalCost - player.balance };
        }
      }
      break;

    case 'act-14': // Loan Approved: +600 (simple credit — no auto-deduction implemented, treated as gift)
      amount = 600;
      updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance + 600 } : p));
      description += ' (₹600 credited — repayment via manual adjustment).';
      break;

    case 'act-15': // Dividend Payout: +100 per property owned
      {
        const propCount = state.properties.filter((p) => p.ownerId === playerId).length;
        amount = propCount * 100;
        updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance + amount } : p));
        description += `, receiving ₹${amount} from ${propCount} properties.`;
      }
      break;

    case 'act-16': // Renovation Collapse: highest property drops 1 level
      {
        const ownedProps = state.properties.filter((p) => p.ownerId === playerId && p.level > 1);
        if (ownedProps.length > 0) {
          ownedProps.sort((a, b) => b.level - a.level);
          const targetProp = ownedProps[0];
          updatedProperties = state.properties.map((p) => (p.id === targetProp.id ? { ...p, level: p.level - 1 } : p));
          description += `, downgrading ${targetProp.cityName} from Level ${targetProp.level} to Level ${targetProp.level - 1}.`;
        } else {
          description += ', but has no properties to downgrade.';
        }
      }
      break;

    case 'act-17': // Police Raid: send another player to jail
      // Note: In the active game UI, banker selects which player to jail before executing
      // Here we send the first active non-current player as default
      {
        const raidTarget = state.players.find((p) => p.id !== playerId && p.status === 'ACTIVE');
        if (raidTarget) {
          updatedPlayers = state.players.map((p) =>
            p.id === raidTarget.id ? { ...p, status: 'IN_JAIL', jailTurns: 0 } : p
          );
          description += `. ${raidTarget.name} has been sent to Jail!`;
        } else {
          description += ', but no eligible player to send to Jail.';
        }
      }
      break;

    case 'act-18': // Road Block: forfeit current turn (end turn)
      description += '. Turn forfeited due to Road Block.';
      break;

    case 'act-19': // Property Swap: no automatic resolution, banker facilitates
      description += '. Banker to facilitate: swap one property with another active player.';
      break;

    case 'act-20': // Rent Immunity: logged only, game UI must check this
      description += '. Rent Immunity active this turn — no rent payable if landing on owned property.';
      break;

    default:
      break;
  }

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'ACTION_CARD',
    sourcePlayerId: playerId,
    amount,
    description,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    status: nextStatus,
    activeDebt,
    players: updatedPlayers,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// Undo Last Valid Game Engine State
export function undoLastAction(state: GameState): GameState {
  if (state.undoStack.length === 0) return state;

  const stack = [...state.undoStack];
  const lastStateStr = stack.pop()!;
  const restoredState = JSON.parse(lastStateStr) as Omit<GameState, 'undoStack'>;

  // Restore the state along with the popped stack
  return {
    ...restoredState,
    undoStack: stack,
  };
}

// Manual Banker Admin Adjustments
export function manualCorrectState(
  state: GameState,
  params: {
    playerId?: string;
    nameChange?: string;
    propertyId?: string;
    balanceChange?: number;
    ownerIdChange?: string | 'UNOWNED';
    levelChange?: number;
    jailStatusChange?: 'IN_JAIL' | 'ACTIVE';
  }
): GameState {
  const updatedUndoStack = pushUndoSnapshot(state);
  
  let updatedPlayers = [...state.players];
  let updatedProperties = [...state.properties];
  let logDesc = 'Manual admin correction applied:'

  if (params.playerId && params.nameChange?.trim()) {
    const pTarget = updatedPlayers.find((p) => p.id === params.playerId);
    const newName = params.nameChange.trim();
    updatedPlayers = updatedPlayers.map((p) =>
      p.id === params.playerId ? { ...p, name: newName } : p
    );
    logDesc += ` Renamed "${pTarget?.name || ''}" → "${newName}".`;
  }

  if (params.playerId && params.balanceChange !== undefined) {
    const pTarget = updatedPlayers.find((p) => p.id === params.playerId);
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.id === params.playerId) {
        return { ...p, balance: Math.max(0, p.balance + params.balanceChange!) };
      }
      return p;
    });
    logDesc += ` Adjusted ${pTarget?.name || ''}'s balance by ₹${params.balanceChange > 0 ? '+' : ''}${params.balanceChange}.`;
  }

  if (params.playerId && params.jailStatusChange !== undefined) {
    const pTarget = updatedPlayers.find((p) => p.id === params.playerId);
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.id === params.playerId) {
        return { 
          ...p, 
          status: params.jailStatusChange === 'IN_JAIL' ? ('IN_JAIL' as const) : ('ACTIVE' as const), 
          jailTurns: 0 
        };
      }
      return p;
    });
    logDesc += ` Set ${pTarget?.name || ''}'s status to ${params.jailStatusChange}.`;
  }

  if (params.propertyId) {
    const propTarget = state.properties.find((p) => p.id === params.propertyId);
    updatedProperties = state.properties.map((p) => {
      if (p.id === params.propertyId) {
        let ownerId = p.ownerId;
        let level = p.level;

        if (params.ownerIdChange !== undefined) {
          ownerId = params.ownerIdChange === 'UNOWNED' ? null : params.ownerIdChange;
        }
        if (params.levelChange !== undefined) {
          level = Math.max(1, Math.min(5, params.levelChange));
        }
        return { ...p, ownerId, level };
      }
      return p;
    });

    logDesc += ` Modified ${propTarget?.cityName || ''}`;
    if (params.ownerIdChange !== undefined) {
      logDesc += ` Owner -> ${params.ownerIdChange}.`;
    }
    if (params.levelChange !== undefined) {
      logDesc += ` Level -> ${params.levelChange}.`;
    }
  }

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'MANUAL_CORRECTION',
    amount: 0,
    description: logDesc,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// ── Targeted Action Handlers & LocalStorage Persistence ──

export function executeTargetedPoliceRaid(
  state: GameState,
  sourcePlayerId: string,
  targetPlayerId: string
): GameState {
  if (state.status !== 'ACTIVE') return state;
  const sourcePlayer = state.players.find((p) => p.id === sourcePlayerId);
  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!sourcePlayer || !targetPlayer || targetPlayer.status !== 'ACTIVE') return state;

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) =>
    p.id === targetPlayerId ? { ...p, status: 'IN_JAIL' as const, jailTurns: 0 } : p
  );

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'ACTION_CARD',
    sourcePlayerId,
    targetPlayerId,
    amount: 0,
    description: `${sourcePlayer.name} played Police Raid! ${targetPlayer.name} has been sent directly to Jail.`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: updatedPlayers,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

export function executeTargetedPropertyUpgrade(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  if (state.status !== 'ACTIVE') return state;
  const player = state.players.find((p) => p.id === playerId);
  const property = state.properties.find((p) => p.id === propertyId);
  if (!player || !property || property.ownerId !== playerId || property.level >= 5) return state;

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedProperties = state.properties.map((p) =>
    p.id === propertyId ? { ...p, level: p.level + 1 } : p
  );

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'ACTION_CARD',
    sourcePlayerId: playerId,
    propertyId,
    amount: 0,
    description: `${player.name} played Development Boom, upgrading ${property.cityName} to Level ${property.level + 1} for free!`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

export function executePropertySwap(
  state: GameState,
  playerAId: string,
  propAId: string,
  playerBId: string,
  propBId: string
): GameState {
  if (state.status !== 'ACTIVE') return state;
  const pA = state.players.find((p) => p.id === playerAId);
  const pB = state.players.find((p) => p.id === playerBId);
  const propA = state.properties.find((p) => p.id === propAId);
  const propB = state.properties.find((p) => p.id === propBId);

  if (!pA || !pB || !propA || !propB || propA.ownerId !== playerAId || propB.ownerId !== playerBId) {
    return state;
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedProperties = state.properties.map((p) => {
    if (p.id === propAId) return { ...p, ownerId: playerBId };
    if (p.id === propBId) return { ...p, ownerId: playerAId };
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'ACTION_CARD',
    sourcePlayerId: playerAId,
    targetPlayerId: playerBId,
    amount: 0,
    description: `${pA.name} and ${pB.name} swapped properties! (${propA.cityName} ⇆ ${propB.cityName})`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

const LOCAL_STORAGE_SAVED_GAME_KEY = 'citymint_active_game_state_v1';

export function saveGameStateToStorage(state: GameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SAVED_GAME_KEY, JSON.stringify(state));
  } catch (_) {}
}

export function loadGameStateFromStorage(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_GAME_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function clearSavedGameState() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_SAVED_GAME_KEY);
  } catch (_) {}
}

// ── Match Analytics & Performance Metrics Computation ──

export interface MatchAnalytics {
  mostValuableLandlord: { player: Player; rentCollected: number } | null;
  topPerformingProperty: { property: Property; totalRentGenerated: number } | null;
  mostActiveBuyer: { player: Player; propertiesBought: number } | null;
  jailbirdAward: { player: Player; jailVisits: number } | null;
  bigSpender: { player: Player; rentPaid: number } | null;
  playerStats: Array<{
    player: Player;
    rentCollected: number;
    rentPaid: number;
    propertiesBought: number;
    jailVisits: number;
    finalNetWorth: number;
  }>;
  progressionSeries: Array<{
    turn: number;
    [playerId: string]: number;
  }>;
}

export function computeMatchAnalytics(state: GameState): MatchAnalytics {
  const rentCollectedMap: Record<string, number> = {};
  const rentPaidMap: Record<string, number> = {};
  const propBoughtMap: Record<string, number> = {};
  const jailVisitsMap: Record<string, number> = {};
  const propRentMap: Record<string, number> = {};

  // Initialize player maps
  state.players.forEach((p) => {
    rentCollectedMap[p.id] = 0;
    rentPaidMap[p.id] = 0;
    propBoughtMap[p.id] = 0;
    jailVisitsMap[p.id] = 0;
  });

  // Initialize property maps
  state.properties.forEach((p) => {
    propRentMap[p.id] = 0;
  });

  // Process transactions chronologically
  const txChronological = [...state.transactions].reverse();

  txChronological.forEach((tx) => {
    if (tx.type === 'RENT') {
      if (tx.targetPlayerId) {
        rentCollectedMap[tx.targetPlayerId] = (rentCollectedMap[tx.targetPlayerId] || 0) + tx.amount;
      }
      if (tx.sourcePlayerId) {
        rentPaidMap[tx.sourcePlayerId] = (rentPaidMap[tx.sourcePlayerId] || 0) + tx.amount;
      }
      if (tx.propertyId) {
        propRentMap[tx.propertyId] = (propRentMap[tx.propertyId] || 0) + tx.amount;
      }
    } else if (tx.type === 'PURCHASE') {
      if (tx.sourcePlayerId) {
        propBoughtMap[tx.sourcePlayerId] = (propBoughtMap[tx.sourcePlayerId] || 0) + 1;
      }
    } else if (tx.type === 'JAIL_ENTER') {
      if (tx.sourcePlayerId) {
        jailVisitsMap[tx.sourcePlayerId] = (jailVisitsMap[tx.sourcePlayerId] || 0) + 1;
      }
    }
  });

  // Turn Progression Series
  const maxTurn = Math.max(1, state.turnNumber);
  const stepCount = Math.min(10, maxTurn);
  const stepSize = Math.max(1, Math.floor(maxTurn / stepCount));
  const progressionSeries: Array<{ turn: number; [playerId: string]: number }> = [];

  for (let t = 1; t <= maxTurn; t += stepSize) {
    const point: { turn: number; [playerId: string]: number } = { turn: t };
    state.players.forEach((p) => {
      const playerTx = txChronological.filter((tx) => tx.turnNumber <= t);
      let balance = 1500; // Starting capital
      playerTx.forEach((tx) => {
        if (tx.targetPlayerId === p.id && tx.type === 'RENT') balance += tx.amount;
        if (tx.sourcePlayerId === p.id && (tx.type === 'RENT' || tx.type === 'PURCHASE' || tx.type === 'TELEPORT')) balance -= tx.amount;
        if (tx.sourcePlayerId === p.id && tx.type === 'START') balance += 2000;
      });
      point[p.id] = Math.max(0, balance);
    });
    progressionSeries.push(point);
  }

  // Find MVPs
  let topLandlordPlayer: Player | null = null;
  let maxRentCollected = -1;
  state.players.forEach((p) => {
    if ((rentCollectedMap[p.id] || 0) > maxRentCollected) {
      maxRentCollected = rentCollectedMap[p.id] || 0;
      topLandlordPlayer = p;
    }
  });

  let topProp: Property | null = null;
  let maxPropRent = -1;
  state.properties.forEach((prop) => {
    if ((propRentMap[prop.id] || 0) > maxPropRent && (propRentMap[prop.id] || 0) > 0) {
      maxPropRent = propRentMap[prop.id] || 0;
      topProp = prop;
    }
  });

  let topBuyerPlayer: Player | null = null;
  let maxBought = -1;
  state.players.forEach((p) => {
    if ((propBoughtMap[p.id] || 0) > maxBought) {
      maxBought = propBoughtMap[p.id] || 0;
      topBuyerPlayer = p;
    }
  });

  let jailbirdPlayer: Player | null = null;
  let maxJail = -1;
  state.players.forEach((p) => {
    if ((jailVisitsMap[p.id] || 0) > maxJail) {
      maxJail = jailVisitsMap[p.id] || 0;
      jailbirdPlayer = p;
    }
  });

  let bigSpenderPlayer: Player | null = null;
  let maxSpenderPaid = -1;
  state.players.forEach((p) => {
    if ((rentPaidMap[p.id] || 0) > maxSpenderPaid) {
      maxSpenderPaid = rentPaidMap[p.id] || 0;
      bigSpenderPlayer = p;
    }
  });

  const playerStats = state.players.map((p) => ({
    player: p,
    rentCollected: rentCollectedMap[p.id] || 0,
    rentPaid: rentPaidMap[p.id] || 0,
    propertiesBought: propBoughtMap[p.id] || 0,
    jailVisits: jailVisitsMap[p.id] || 0,
    finalNetWorth: calculateNetWorth(p, state.properties),
  }));

  return {
    mostValuableLandlord: topLandlordPlayer && maxRentCollected > 0 ? { player: topLandlordPlayer, rentCollected: maxRentCollected } : null,
    topPerformingProperty: topProp && maxPropRent > 0 ? { property: topProp, totalRentGenerated: maxPropRent } : null,
    mostActiveBuyer: topBuyerPlayer && maxBought > 0 ? { player: topBuyerPlayer, propertiesBought: maxBought } : null,
    jailbirdAward: jailbirdPlayer && maxJail > 0 ? { player: jailbirdPlayer, jailVisits: maxJail } : null,
    bigSpender: bigSpenderPlayer && maxSpenderPaid > 0 ? { player: bigSpenderPlayer, rentPaid: maxSpenderPaid } : null,
    playerStats,
    progressionSeries,
  };
}

// ── Property Auction Resolution ──

export function executeAuctionWin(
  state: GameState,
  propertyId: string,
  winningPlayerId: string,
  winningBidAmount: number
): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === winningPlayerId);
  const property = state.properties.find((p) => p.id === propertyId);

  if (!player || !property || property.ownerId !== null || player.balance < winningBidAmount) {
    return state;
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) => {
    if (p.id === winningPlayerId) {
      return { ...p, balance: p.balance - winningBidAmount };
    }
    return p;
  });

  let updatedProperties = state.properties.map((p) => {
    if (p.id === propertyId) {
      return { ...p, ownerId: winningPlayerId };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'PURCHASE',
    sourcePlayerId: winningPlayerId,
    amount: winningBidAmount,
    propertyId: propertyId,
    description: `${player.name} won live auction for ${property.cityName} at ₹${winningBidAmount}`,
    createdAt: new Date().toISOString(),
  };

  // Perform Group Completion Check: All properties in group owned by SAME player
  let updatedCompletedGroups = [...state.completedGroups];
  const group = PROPERTY_GROUPS[property.groupId];
  if (group) {
    const groupProperties = updatedProperties.filter((p) => p.groupId === property.groupId);
    const allOwnedBySamePlayer = groupProperties.every((p) => p.ownerId === winningPlayerId);
    const alreadyCompleted = state.completedGroups.includes(property.groupId);

    if (allOwnedBySamePlayer && !alreadyCompleted) {
      updatedCompletedGroups.push(property.groupId);
      updatedProperties = updatedProperties.map((p) => {
        if (p.groupId === property.groupId) {
          return { ...p, level: Math.min(p.level + 1, 5) };
        }
        return p;
      });
    }
  }

  return {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    completedGroups: updatedCompletedGroups,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// ── Manual Property Level Upgrade (Development) ──

export function upgradePropertyLevel(state: GameState, playerId: string, propertyId: string): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === playerId);
  const property = state.properties.find((p) => p.id === propertyId);

  if (!player || !property || property.ownerId !== playerId || property.level >= 5) {
    return state;
  }

  const upgradeCost = property.baseRent * 5;
  if (player.balance < upgradeCost) {
    return state; // Insufficient cash
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance - upgradeCost };
    }
    return p;
  });

  const updatedProperties = state.properties.map((p) => {
    if (p.id === propertyId) {
      return { ...p, level: p.level + 1 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'MANUAL_CORRECTION',
    sourcePlayerId: playerId,
    amount: upgradeCost,
    propertyId: propertyId,
    description: `${player.name} upgraded ${property.cityName} to Level ${property.level + 1} for ₹${upgradeCost}`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}

// Free +1 level upgrade awarded when a player lands on their own property (no cost)
export function landOnOwnPropertyUpgrade(state: GameState, playerId: string, propertyId: string): GameState {
  if (state.status !== 'ACTIVE') return state;

  const player = state.players.find((p) => p.id === playerId);
  const property = state.properties.find((p) => p.id === propertyId);

  if (!player || !property || property.ownerId !== playerId || property.level >= 5) {
    return state;
  }

  const updatedUndoStack = pushUndoSnapshot(state);

  const updatedProperties = state.properties.map((p) => {
    if (p.id === propertyId) {
      return { ...p, level: p.level + 1 };
    }
    return p;
  });

  const transaction: GameTransaction = {
    id: crypto.randomUUID(),
    turnNumber: state.turnNumber,
    type: 'MANUAL_CORRECTION',
    sourcePlayerId: playerId,
    amount: 0,
    propertyId: propertyId,
    description: `${player.name} landed on their own ${property.cityName} — free upgrade to Level ${property.level + 1}!`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    properties: updatedProperties,
    transactions: [transaction, ...state.transactions],
    undoStack: updatedUndoStack,
    updatedAt: new Date().toISOString(),
  };
}
