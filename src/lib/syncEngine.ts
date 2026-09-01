import { supabase, isSupabaseConfigured } from './supabase';
import { GameState } from './gameEngine';
import { localAddToSyncQueue, localGetSyncQueue, localRemoveFromSyncQueue } from './db';

// Sync whole game state (upsert all related tables)
export async function syncGameStateToSupabase(state: GameState): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    // 1. Sync main game record
    const { error: gameErr } = await supabase.from('games').upsert({
      id: state.id,
      status: state.status,
      current_player_id: state.currentPlayerId,
      turn_number: state.turnNumber,
      winner_id: state.winnerId,
      created_at: state.createdAt,
      updated_at: state.updatedAt,
      ended_at: state.endedAt,
    });

    if (gameErr) throw gameErr;

    // 2. Sync players
    const playersData = state.players.map((p) => ({
      game_id: state.id,
      player_id: p.id,
      player_code: p.playerCode,
      name: p.name,
      color: p.color,
      balance: p.balance,
      status: p.status,
      jail_turns: p.jailTurns,
    }));

    const { error: playersErr } = await supabase.from('game_players').upsert(playersData);
    if (playersErr) throw playersErr;

    // 3. Sync properties
    const propertiesData = state.properties.map((p) => ({
      game_id: state.id,
      property_id: p.id,
      owner_id: p.ownerId,
      level: p.level,
    }));

    const { error: propertiesErr } = await supabase.from('game_properties').upsert(propertiesData);
    if (propertiesErr) throw propertiesErr;

    // 4. Sync transactions
    if (state.transactions.length > 0) {
      const txData = state.transactions.map((t) => ({
        id: t.id,
        game_id: state.id,
        turn_number: t.turnNumber,
        type: t.type,
        source_player_id: t.sourcePlayerId,
        target_player_id: t.targetPlayerId,
        amount: t.amount,
        property_id: t.propertyId,
        metadata: { description: t.description },
        created_at: t.createdAt,
      }));

      const { error: txErr } = await supabase.from('transactions').upsert(txData);
      if (txErr) throw txErr;
    }

    console.log(`[Sync Engine] Successfully synced game ${state.id} to Supabase.`);
    return true;
  } catch (err: any) {
    const errorMsg = err?.message || err?.details || err?.hint || (typeof err === 'object' ? JSON.stringify(err) : String(err));
    console.warn(`[Sync Engine] Cloud sync deferred for ${state.id} (offline/unreachable): ${errorMsg}`);
    
    // Add to sync queue for offline retry
    await localAddToSyncQueue({
      id: crypto.randomUUID(),
      gameId: state.id,
      payload: state,
      timestamp: new Date().toISOString(),
    });
    
    return false;
  }
}

// Background sync worker to flush the queue
export async function flushSyncQueue(): Promise<void> {
  if (!isSupabaseConfigured || !supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return;
  }

  const queue = await localGetSyncQueue();
  if (queue.length === 0) return;

  console.log(`[Sync Engine] Found ${queue.length} pending items in sync queue. Syncing now...`);

  for (const item of queue) {
    try {
      const state = item.payload as GameState;
      
      const success = await syncGameStateToSupabase(state);
      if (success) {
        await localRemoveFromSyncQueue(item.id);
        console.log(`[Sync Engine] Resolved queue item ${item.id}.`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || err?.details || String(err);
      console.warn(`[Sync Engine] Error processing queue item ${item.id}: ${errorMsg}`);
      break;
    }
  }
}
