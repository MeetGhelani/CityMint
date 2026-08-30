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

export const PROPERTY_GROUPS: Record<string, { name: string; color: string; count: number }> = {
  brown: { name: 'Coastal Gateway', color: '#8B4513', count: 2 },
  lightblue: { name: 'Historic Heartland', color: '#87CEEB', count: 3 },
  pink: { name: 'Industrial Hubs', color: '#FF69B4', count: 3 },
  orange: { name: 'Tech Corridors', color: '#FFA500', count: 3 },
  red: { name: 'Smart Cities', color: '#FF0000', count: 3 },
  yellow: { name: 'Metropolises', color: '#FFD700', count: 3 },
  green: { name: 'Financial Capital', color: '#008000', count: 3 },
  blue: { name: 'Elite Zone', color: '#0000FF', count: 2 },
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
  { id: 'act-1', name: 'Tax Refund', category: 'Money', description: 'Receive ₹500 from the Bank.' },
  { id: 'act-2', name: 'Traffic Fine', category: 'Money', description: 'Pay ₹300 fine to the Bank.' },
  { id: 'act-3', name: 'Birthday Bash', category: 'Money', description: 'Collect ₹200 from each player.' },
  { id: 'act-4', name: 'Infrastructure Levy', category: 'Property', description: 'Pay ₹150 for each property you own.' },
  { id: 'act-5', name: 'Speeding Fine', category: 'Jail', description: 'Go directly to Jail.' },
  { id: 'act-6', name: 'Pardon Card', category: 'Jail', description: 'Get Out of Jail Free (keep this card).' },
  { id: 'act-7', name: 'Free Transit', category: 'Movement', description: 'Move to any Teleport space for free.' },
  { id: 'act-8', name: 'Inheritance Reward', category: 'Money', description: 'Receive ₹1,000 from the Bank.' },
  { id: 'act-9', name: 'Development Boom', category: 'Property', description: 'Upgrade one of your properties by +1 level.' },
  { id: 'act-10', name: 'Community Feast', category: 'Money', description: 'Pay ₹300 to each player.' },
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
export function createGame(playersData: { name: string; color: string; playerCode: string }[]): GameState {
  const id = generateGameId();
  const players: Player[] = playersData.map((p, idx) => ({
    id: `player-${idx + 1}`,
    playerCode: p.playerCode,
    name: p.name,
    color: p.color,
    balance: 10000, // ₹10,000 starting cash
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

  const updatedPlayers = state.players.map((p) => {
    if (p.id === nextPlayer.id && p.status === 'IN_JAIL') {
      return { ...p, jailTurns: p.jailTurns + 1 };
    }
    return p;
  });

  return {
    ...state,
    currentPlayerId: nextPlayer.id,
    turnNumber: state.currentPlayerId === activePlayers[activePlayers.length - 1].id ? state.turnNumber + 1 : state.turnNumber,
    players: updatedPlayers,
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

  // Perform Group Bonus Check
  let updatedCompletedGroups = [...state.completedGroups];
  const group = PROPERTY_GROUPS[property.groupId];
  if (group) {
    const groupProperties = updatedProperties.filter((p) => p.groupId === property.groupId);
    const allOwned = groupProperties.every((p) => p.ownerId !== null);
    const alreadyCompleted = state.completedGroups.includes(property.groupId);

    if (allOwned && !alreadyCompleted) {
      updatedCompletedGroups.push(property.groupId);
      // Upgrade all properties in group by +1 level (capped at 5)
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

  const val = getPropertyValue(property);
  const refund = Math.floor(val / 2); // Half-value refund

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
    description: `${player.name} sold ${property.cityName} for ₹${refund} (Mortgage / Liquidation)`,
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
  let logDesc = 'Manual admin correction applied:';

  if (params.playerId && params.balanceChange !== undefined) {
    const pTarget = state.players.find((p) => p.id === params.playerId);
    updatedPlayers = state.players.map((p) => {
      if (p.id === params.playerId) {
        return { ...p, balance: Math.max(0, p.balance + params.balanceChange!) };
      }
      return p;
    });
    logDesc += ` Adjusted ${pTarget?.name || ''}'s balance by ₹${params.balanceChange > 0 ? '+' : ''}${params.balanceChange}.`;
  }

  if (params.playerId && params.jailStatusChange !== undefined) {
    const pTarget = state.players.find((p) => p.id === params.playerId);
    updatedPlayers = state.players.map((p) => {
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
