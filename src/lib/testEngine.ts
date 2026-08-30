import { 
  createGame, 
  passStart, 
  purchaseProperty, 
  payRent, 
  sendToJail, 
  releaseFromJail, 
  sellProperty, 
  declareBankruptcy, 
  undoLastAction,
  getPropertyValue,
  calculateNetWorth,
  GameState
} from './gameEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runEngineTests() {
  console.log('--- STARTING GAME ENGINE VALIDATION ---');

  // Test 1: Create Game
  const players = [
    { name: 'Amit', color: 'blue', playerCode: 'CM-PLAYER-AMIT' },
    { name: 'Rahul', color: 'red', playerCode: 'CM-PLAYER-RAHUL' },
    { name: 'Sachin', color: 'green', playerCode: 'CM-PLAYER-SACHIN' },
  ];
  let state = createGame(players);
  assert(state.players.length === 3, 'Game must have 3 players');
  assert(state.players[0].balance === 10000, 'Amit starting balance must be 10000');
  assert(state.properties.find((p) => p.id === 'mumbai')?.level === 1, 'Mumbai level must start at 1');
  console.log('✔ Test 1 passed: Starting game configuration validated.');

  // Test 2: Pass Start
  state = passStart(state, 'player-3'); // Sachin passes Start
  assert(state.players[2].balance === 12000, 'Sachin balance must be 12000 after passing start');
  console.log('✔ Test 2 passed: Pass Start rewards credited.');

  // Test 3: Buy Property
  state = purchaseProperty(state, 'player-1', 'mumbai'); // Amit buys Mumbai (₹4,500)
  assert(state.players[0].balance === 5500, 'Amit balance must be 5500 after buying Mumbai');
  assert(state.properties.find((p) => p.id === 'mumbai')?.ownerId === 'player-1', 'Mumbai owner must be Amit');
  console.log('✔ Test 3 passed: Property purchase completed.');

  // Test 4: Pay Rent (L1)
  state = payRent(state, 'player-2', 'mumbai'); // Rahul lands on Mumbai
  // Mumbai base rent = 400. Level 1 multiplier = 1.0. Rent = 400.
  assert(state.players[1].balance === 9600, 'Rahul balance must be 9600 after paying rent');
  assert(state.players[0].balance === 5900, 'Amit balance must be 5900 after receiving rent');
  // Property level increases by +1 on landing, L1 -> L2
  assert(state.properties.find((p) => p.id === 'mumbai')?.level === 2, 'Mumbai level must increase to 2');
  console.log('✔ Test 4 passed: Rent payment and level-ups validated.');

  // Test 5: Pay Rent (L2)
  state = payRent(state, 'player-2', 'mumbai'); // Rahul lands on Mumbai again
  // Mumbai base rent = 400. Level 2 multiplier = 1.4. Rent = 560.
  assert(state.players[1].balance === 9600 - 560, 'Rahul balance must be 9040');
  assert(state.players[0].balance === 5900 + 560, 'Amit balance must be 6460');
  assert(state.properties.find((p) => p.id === 'mumbai')?.level === 3, 'Mumbai level must increase to 3');
  console.log('✔ Test 5 passed: Multiplier rent scaling validated.');

  // Test 6: Group Completion Bonus
  state = purchaseProperty(state, 'player-1', 'delhi'); // Amit buys Delhi (₹5,000)
  assert(state.players[0].balance === 6460 - 5000, 'Amit balance must be 1460');
  
  // Sachin buys Gurugram (₹5,500) to complete the Green group (Mumbai, Delhi, Gurugram)
  state = purchaseProperty(state, 'player-3', 'gurugram'); 
  assert(state.players[2].balance === 12000 - 5500, 'Sachin balance must be 6500');

  // Verify group completed status and +1 levels upgrades
  assert(state.completedGroups.includes('green'), 'Green group must be completed');
  // Mumbai goes L3 -> L4. Delhi goes L1 -> L2. Gurugram goes L1 -> L2.
  assert(state.properties.find((p) => p.id === 'mumbai')?.level === 4, 'Mumbai must upgrade to L4');
  assert(state.properties.find((p) => p.id === 'delhi')?.level === 2, 'Delhi must upgrade to L2');
  assert(state.properties.find((p) => p.id === 'gurugram')?.level === 2, 'Gurugram must upgrade to L2');
  console.log('✔ Test 6 passed: Group completion checks and levels upgrade bonus validated.');

  // Test 7: Jail Rent Override
  state = sendToJail(state, 'player-1'); // Send Amit to Jail
  assert(state.players[0].status === 'IN_JAIL', 'Amit must be in Jail');
  
  // Rahul lands on Mumbai. Normally rent is ₹1,000 (L4 = 400 * 2.5). But Amit is in Jail.
  state = payRent(state, 'player-2', 'mumbai');
  assert(state.players[1].balance === 9040, 'Rahul balance must remain 9040 (paid ₹0 rent)');
  assert(state.players[0].balance === 1460, 'Amit balance must remain 1460');
  // Property level still increases on landing (L4 -> L5)
  assert(state.properties.find((p) => p.id === 'mumbai')?.level === 5, 'Mumbai level must increase to 5 (MAX)');
  
  // Release Amit
  state = releaseFromJail(state, 'player-1', 'PAY');
  assert(state.players[0].status === 'ACTIVE', 'Amit must be active');
  assert(state.players[0].balance === 1460 - 500, 'Amit balance must be 960 after jail release fee');
  console.log('✔ Test 7 passed: Jailed landlord rent overrides and level progressions validated.');

  // Test 8: Debt Settlement via Property Sale
  // Artificially deplete Sachin's cash to ₹100
  state.players[2].balance = 100;
  
  // Sachin lands on Mumbai. Mumbai L5 rent is 400 * 3.5 = ₹1,400.
  // Sachin cash (100) < 1400. Puts game into BANKRUPTCY_REVIEW mode.
  state = payRent(state, 'player-3', 'mumbai');
  assert(state.status === 'BANKRUPTCY_REVIEW', 'Game must enter bankruptcy review status');
  assert(state.activeDebt !== undefined, 'Active debt details must be populated');
  assert(state.activeDebt?.shortfall === 1300, 'Shortfall must be 1300');

  // Sachin sells Gurugram (L2). 
  // Gurugram value = purchasePrice (5500) + (level - 1)*(baseRent * 5) = 5500 + 1*(500*5) = 8000.
  // Sale refund value = 8000 / 2 = 4000.
  state = sellProperty(state, 'player-3', 'gurugram');
  
  // Sachin's cash goes 100 + 4000 = ₹4,100.
  // This satisfies the ₹1,400 debt (shortfall <= 0), which automatically triggers resolveDebt.
  // Sachin balance becomes 4100 - 1400 = 2700. Amit balance becomes 960 + 1400 = 2360.
  // Status returns to ACTIVE.
  assert(state.status === 'ACTIVE', 'Debt should be auto-resolved and status returned to ACTIVE');
  assert(state.players[2].balance === 2700, 'Sachin cash must be 2700');
  assert(state.players[0].balance === 2360, 'Amit cash must be 2360');
  assert(state.properties.find((p) => p.id === 'gurugram')?.ownerId === null, 'Gurugram ownership must revert to null');
  assert(state.properties.find((p) => p.id === 'gurugram')?.level === 1, 'Gurugram level must reset to 1');
  console.log('✔ Test 8 passed: Debt settlement calculations and asset liquidations validated.');

  // Test 9: Transactional Undo
  const preUndoLength = state.transactions.length;
  state = undoLastAction(state); // Undo the Gurugram sale & rent resolution
  assert(state.status === 'BANKRUPTCY_REVIEW', 'Restored state must be back in bankruptcy review');
  assert(state.players[2].balance === 100, 'Sachin balance must revert back to 100');
  assert(state.properties.find((p) => p.id === 'gurugram')?.ownerId === 'player-3', 'Sachin must own Gurugram again');
  console.log('✔ Test 9 passed: Full transactional undo rollback validated.');

  console.log('--- ALL GAME ENGINE TESTS PASSED ---');
}
